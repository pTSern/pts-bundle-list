import { AssetInfo, IAssetMeta } from "@cocos/creator-types/editor/packages/asset-db/@types/public";
import pkg from '../package.json'
import path from 'path'
import fs from 'fs'

interface _IConfig {
    "global_variable_key": string
    "plugin_name": string
    "plugin_location": string
    "is_registered_to_bridge": boolean
}

type _TIs =  "is_listing_prefabs" | "is_listing_imgs" | "is_listing_json"

const __config_: _IConfig = Object.create(null);
const __this_: Record<string, any> = Object.create(null);
__this_.promise = new Promise( _rs => __this_.resolver = _rs );
__this_.filters = new Set<string>()

export const methods: { [key: string]: (...any: any) => any } = {
    "profile::project::changed_listing": async function(key: _TIs, value: boolean) {
        switch(key) {
            case 'is_listing_imgs': {
                __this_.filters[value ? 'add' : "delete"]("cc.ImageAsset")
                _shiping();
                break;
            }
            case 'is_listing_json': {
                __this_.filters[value ? 'add' : "delete"]("cc.JsonAsset")
                _shiping();
                break;
            }
            case 'is_listing_prefabs': {
                __this_.filters[value ? 'add' : "delete"]("cc.Prefab")
                _shiping();
                break;
            }
        }
    },
    "profile::project::changed": async function<_TKey extends keyof _IConfig>(key: _TKey, value: _IConfig[_TKey]) {
        __config_[key] = value;
        _shiping();
    },
    "profile::project::changed_location": async function<_TKey extends keyof _IConfig>(key: _TKey, value: _IConfig[_TKey]) {
        const _dir = _getConfigDir();
        if(!_dir) {
            __config_[key] = value;
            return _shiping();
        }

        const [ sorting_plug_list, js_file_info ] = await Promise.all([
            Editor.Profile.getProject('project', 'script.sortingPlugin'),
            Editor.Message.request('asset-db', 'query-asset-info', `${_dir.db}/${__config_.plugin_name}.js`)
        ])

        const _new_plug_list = (sorting_plug_list as string[]).filter(_ => js_file_info?.uuid != _)

        Promise.all([
            Editor.Message.request('asset-db', 'delete-asset', `${_dir.db}/${__config_.plugin_name}.js`),
            Editor.Message.request('asset-db', 'delete-asset', `${_dir.db}/${__config_.plugin_name}.d.ts`)
        ])
        .then(_ => console.log(`${pkg.name} >> Deleted assets: `, _))
        .catch(_ => console.warn(`${pkg.name} >> Can not delete assets: `, _))
        .finally(async () => {
            __config_[key] = value;
            await _shiping();

            const _new = _getConfigDir();
            if(!_new) return;
            const _js_url = `${_new.db}/${__config_.plugin_name}.js`;
            const _new_info = await Editor.Message.request('asset-db', 'query-asset-info', _js_url)
            _new_info?.uuid && _new_plug_list.push(_new_info.uuid);

            await Editor.Profile.setProject('project', 'script.sortingPlugin', _new_plug_list);
        })
    }
};

async function _shiping() {
    await __this_.promise;
    if(!__config_) return;

    const _dir = _getConfigDir();
    if(!_dir) {
        console.warn(`${pkg.name} >> Plugin location is not specified`);
        return;
    }

    try {
        if(!fs.existsSync(_dir.physic)) {
            fs.mkdirSync(_dir.physic, { recursive: true })
            await Editor.Message.request('asset-db', "refresh-asset", _dir.db);
        }

    } catch(_error) {
        console.error(`${pkg.name} >> Failed to mkdir`, _dir, _error);

        return
    }

    return _fetch();
}

function _getConfigDir() {
    const plugin_location = __config_.plugin_location || '';
    if (!plugin_location) {
        console.warn("Plugin location is not specified.");
        return null
    }

    let db = '';
    if (plugin_location.startsWith('project://assets')) {
        db = 'db://' + plugin_location.substring('project://'.length);
    } else if (plugin_location.startsWith('db://assets')) {
        db = plugin_location;
    } else if (plugin_location.startsWith('project://')) {
        const rel = plugin_location.substring('project://'.length);
        if (rel.startsWith('assets')) {
            db = 'db://' + rel;
        } else {
            db = 'db://assets/' + rel;
        }
    } else if (path.isAbsolute(plugin_location)) {
        const normalizedAbsDir = plugin_location.replace(/\\/g, '/');
        const normalizedAssetsDir = path.join(Editor.Project.path, 'assets').replace(/\\/g, '/');
        if (normalizedAbsDir.startsWith(normalizedAssetsDir)) {
            const rel = normalizedAbsDir.substring(normalizedAssetsDir.length);
            db = 'db://assets' + (rel.startsWith('/') ? rel : '/' + rel);
        } else {
            db = 'db://assets';
        }
    } else {
        // It's relative to assets/ directory! E.g. "scripts/__plugins__"
        db = 'db://assets/' + plugin_location;
    }

    if (db.endsWith('/')) {
        db = db.substring(0, db.length - 1);
    }

    // Ensure the folder exists physically on disk
    return {
        physic: db.replace('db://assets', path.join(Editor.Project.path, 'assets')),
        db
    }
}

async function _getConfig() {
    const _proj = await Editor.Profile.getProject(pkg.name);

    __config_.global_variable_key = _proj.global_variable_key || 'pTS.bundle.list'
    __config_.plugin_name = _proj.plugin_name || "__bundle_list"
    __config_.plugin_location = _proj.plugin_location || ""
    __config_.is_registered_to_bridge = typeof _proj.is_registered_to_bridge === 'boolean' ? _proj.is_registered_to_bridge : true

    __this_.filters = __this_.filters || new Set<string>();
    (typeof _proj.is_listing_prefabs === 'boolean' ? _proj.is_listing_prefabs : true) && __this_.filters.add("cc.Prefab");
    (Boolean(_proj.is_listing_json)) && __this_.filters.add("cc.JsonAsset");
    (Boolean(_proj.is_listing_imgs)) && __this_.filters.add("cc.ImageAsset");

    return __config_;
}

async function _fetch() {
    const _all = await Editor.Message.request('asset-db', 'query-assets', { pattern: "db://assets/**/*" });

    const _pmetas = _all.map(async info => {
        if(!info.isDirectory) return;
        const meta = await Editor.Message.request('asset-db', 'query-asset-meta', info.uuid);

        if(!meta) return 
        if(!meta.userData?.isBundle) return

        return { meta, info }
    })

    const _metas = await Promise.all(_pmetas);
    await _generator(_metas);
}

async function _generator(list: ({ meta: IAssetMeta, info: AssetInfo } | undefined)[]) {

    const _enums = Object.create(null);
    const _obj = { __enums__: null } as Record<string, any>;

    const promises = list.map(async (c) => {
        if (!c) return;

        _obj[c.info.name] = c.info.name;

        const assets = await Editor.Message.request(
            'asset-db',
            'query-assets',
            {
                pattern: `${c.info.path}/**/*`,
                ccType: Array.from(__this_.filters) as string[]
            }
        ) as any[];

        _enums[c.info.name] = assets.reduce( (_p, _c) => {
            const _names = _c.name.split('.')
            const _name = _names.slice(0, -1).join('.')
            const _type = _c.type.replace("cc.", "")
            _p[_type] = _p[_type] || Object.create(null)
            _p[_type][_name] = _name
            return _p;
        }, Object.create(null) );
    });

    await Promise.all(promises);

    const _parts = (__config_.global_variable_key || '').split('.').filter(Boolean);
    if (_parts.length === 0) {
        console.warn(`${pkg.name} >> global_variable_key is not configured correctly`);
        return;
    }

    const enumKeys = Object.keys(_obj).filter(k => k !== '__enums__');
    const filterTypes = Array.from(__this_.filters as Set<string> || []).map(f => f.replace("cc.", ""));

    const _typeObj = { __enums__: null } as Record<string, any>;
    for (const t of filterTypes) {
        _typeObj[t] = t;
    }

    // Generate JS (compact/minified)
    let _js = `const _$enums=${JSON.stringify(_enums)};`;

    // Write all Enum_${bundle}_${type} constants
    for (const key of enumKeys) {
        for (const type of filterTypes) {
            const assetObj = (_enums[key] && _enums[key][type]) || {};
            _js += `const Enum_${key}_${type}=${JSON.stringify(assetObj)};`;
        }
    }

    if (_parts.length === 1) {
        _js += `globalThis['${_parts[0]}']={`;
        _js += `container:_$enums,`;
        _js += `get:(_$k,_$t)=>_$enums[_$k][_$t],`;
        _js += `bundle:{`;
        _js += `list:${JSON.stringify(enumKeys)},`;
        _js += `array:${JSON.stringify(enumKeys)},`;
        _js += `Enum:${JSON.stringify(_obj)},`;
        _js += `CCEnums:${JSON.stringify(enumKeys.map(k => ({ name: k, value: k })))},`;
        _js += `},`;
        _js += `type:{`;
        _js += `list:${JSON.stringify(filterTypes)},`;
        _js += `array:${JSON.stringify(filterTypes)},`;
        _js += `Enum:${JSON.stringify(_typeObj)},`;
        _js += `CCEnums:${JSON.stringify(filterTypes.map(t => ({ name: t, value: t })))},`;
        _js += `},`;
        for (const key of enumKeys) {
            for (const type of filterTypes) {
                _js += `Enum_${key}_${type}:Enum_${key}_${type},`;
            }
        }
        _js += `};`;
    } else {
        _js += `const _$=globalThis['${_parts[0]}']=globalThis['${_parts[0]}']||Object.create(null);`;
        let access = `_$`;
        for (let i = 1; i < _parts.length - 1; i++) {
            const part = _parts[i];
            _js += `${access}['${part}']=${access}['${part}']||Object.create(null);`;
            access += `['${part}']`;
        }
        _js += `${access}['${_parts[_parts.length - 1]}']={`;
        _js += `container:_$enums,`;
        _js += `get:(_$k,_$t)=>_$enums[_$k][_$t],`;
        _js += `bundle:{`;
        _js += `list:${JSON.stringify(enumKeys)},`;
        _js += `array:${JSON.stringify(enumKeys)},`;
        _js += `Enum:${JSON.stringify(_obj)},`;
        _js += `CCEnums:${JSON.stringify(enumKeys.map(k => ({ name: k, value: k })))},`;
        _js += `},`;
        _js += `type:{`;
        _js += `list:${JSON.stringify(filterTypes)},`;
        _js += `array:${JSON.stringify(filterTypes)},`;
        _js += `Enum:${JSON.stringify(_typeObj)},`;
        _js += `CCEnums:${JSON.stringify(filterTypes.map(t => ({ name: t, value: t })))},`;
        _js += `},`;
        for (const key of enumKeys) {
            for (const type of filterTypes) {
                _js += `Enum_${key}_${type}:Enum_${key}_${type},`;
            }
        }
        _js += `};`;
    }

    if (__config_.is_registered_to_bridge) {
        _js += `const _$pts=globalThis.pTS;if(!!_$pts){const _$bridge=_$pts.bridge;(!!_$bridge&&typeof _$bridge.set=='function')?_$bridge.set('bundles',globalThis['${_parts.join("']['")}'].bundle.Enum):console.warn('[pTS.bridge] is not defined');}`;
    }

    // Generate d.ts
    let _dts = "";

    _dts += `declare namespace ${_parts[0]} {\n`;
    for (let i = 1; i < _parts.length; i++) {
        const indentStr = '\t'.repeat(i);
        _dts += `${indentStr}export namespace ${_parts[i]} {\n`;
    }

    const indent = '\t'.repeat(_parts.length);
    const innerIndent = '\t'.repeat(_parts.length + 1);
    const innerInnerIndent = '\t'.repeat(_parts.length + 2);

    // Write the sub-enum definitions Enum_${bundle}_${type}
    for (const key of enumKeys) {
        const bundleEnums = _enums[key] || {};
        for (const type of filterTypes) {
            const assetObj = bundleEnums[type] || {};
            const assetKeys = Object.keys(assetObj).filter(ak => ak !== '__enums__');
            
            _dts += `${indent}enum Enum_${key}_${type} {\n`;
            _dts += assetKeys.length > 0 ? assetKeys.map(ak => `${innerIndent}${ak} = "${assetObj[ak]}"`).join(',\n') + '\n' : '';
            _dts += `${indent}}\n`;
        }
    }
    _dts += '\n';

    // TContainer
    _dts += `${indent}export type TContainer = {\n`;
    for (const key of enumKeys) {
        _dts += `${innerIndent}${key}: {\n`;
        for (const type of filterTypes) {
            _dts += `${innerInnerIndent}${type}: typeof Enum_${key}_${type};\n`;
        }
        _dts += `${innerIndent}}\n`;
    }
    _dts += `${indent}}\n\n`;

    // namespace bundle
    _dts += `${indent}export namespace bundle {\n`;
    _dts += `${innerIndent}export const list: [${enumKeys.map(k => `"${k}"`).join(', ')}];\n`;
    _dts += `${innerIndent}export type TType = typeof list[number];\n`;
    _dts += `${innerIndent}export enum Enum {\n`;
    _dts += enumKeys.length > 0 ? enumKeys.map(k => `${innerInnerIndent}${k} = "${_obj[k]}"`).join(',\n') + '\n' : '';
    _dts += `${innerIndent}}\n`;
    _dts += `${innerIndent}export const CCEnums: { name: TType; value: TType }[];\n`;
    _dts += `${indent}}\n\n`;

    // namespace type
    _dts += `${indent}export namespace type {\n`;
    _dts += `${innerIndent}export const list: [${filterTypes.map(t => `"${t}"`).join(', ')}];\n`;
    _dts += `${innerIndent}export type TType = typeof list[number];\n`;
    _dts += `${innerIndent}export enum Enum {\n`;
    _dts += filterTypes.length > 0 ? filterTypes.map(t => `${innerInnerIndent}${t} = "${_typeObj[t]}"`).join(',\n') + '\n' : '';
    _dts += `${innerIndent}}\n`;
    _dts += `${innerIndent}export const CCEnums: { name: TType; value: TType }[];\n`;
    _dts += `${indent}}\n\n`;

    // container and get
    _dts += `${indent}export const container: TContainer;\n`;
    _dts += `${indent}function get<_TKey extends bundle.TType, _TType extends type.TType>(key: _TKey, type: _TType): TContainer[_TKey][_TType];\n`;

    // Close namespaces
    for (let i = _parts.length - 1; i >= 0; i--) {
        const indentStr = '\t'.repeat(i);
        _dts += `${indentStr}}\n`;
    }

    if (__config_.is_registered_to_bridge) {
        _dts += `
declare namespace pTS {
    export namespace bridge {
        export type _TBundles_Definded_By_Extensions = {
            bundles: typeof ${__config_.global_variable_key}.bundle.Enum
        }
    }
}
`;
    }

    // Write physical files
    const _dir = _getConfigDir();
    if (!_dir) {
        console.warn(`${pkg.name} >> Plugin location not found`);
        return;
    }

    const jsPath = path.join(_dir.physic, `${__config_.plugin_name}.js`);
    const dtsPath = path.join(_dir.physic, `${__config_.plugin_name}.d.ts`);

    try {
        fs.writeFileSync(jsPath, _js, 'utf8');

        const jsUrl = `${_dir.db}/${__config_.plugin_name}.js`;
        const dtsUrl = `${_dir.db}/${__config_.plugin_name}.d.ts`;

        // Force refresh to make sure Cocos Creator registers the asset and generates its .meta file
        await Editor.Message.request('asset-db', 'refresh-asset', jsUrl);

        // Update meta for JS to make it a plugin
        const __objMeta = await Editor.Message.request('asset-db', 'query-asset-meta', jsUrl);
        console.log(`[${pkg.name}] >> _OBJ MEta >>`, __objMeta);

        if (__objMeta) {
            __objMeta.userData = __objMeta.userData || {};
            const __objPluginSettings = {
                isPlugin: true,
                loadPluginInWeb: true,
                loadPluginInNative: true,
                loadPluginInEditor: true,
                loadPluginInPreview: true,
                loadPluginInMiniGame: true
            };

            let __bNeedUpdate = false;
            for (const __strKey in __objPluginSettings) {
                if (__objMeta.userData[__strKey] !== (__objPluginSettings as any)[__strKey]) {
                    __objMeta.userData[__strKey] = (__objPluginSettings as any)[__strKey];
                    __bNeedUpdate = true;
                }
            }

            if (__bNeedUpdate) {
                await Editor.Message.request('asset-db', 'save-asset-meta', __objMeta.uuid, JSON.stringify(__objMeta));
                await Editor.Message.request('asset-db', 'refresh-asset', jsUrl);
            }
        }

        // Save DTS file
        fs.writeFileSync(dtsPath, _dts, 'utf8');
        await Editor.Message.request('asset-db', 'refresh-asset', dtsUrl);

    } catch (e) {
        console.error(`${pkg.name} >> Failed to write plugin assets`, e);
    }
}

export function load() {
	//@ts-ignore
    Editor.Message.addBroadcastListener('asset-db:ready', _shiping);
    _getConfig().then(_ => __this_.resolver())
}

export function unload() {

	//@ts-ignore
    Editor.Message.removeBroadcastListener('asset-db:ready', _shiping)
}
