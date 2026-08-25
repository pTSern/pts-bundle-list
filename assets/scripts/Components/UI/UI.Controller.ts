import { _decorator, Asset, CCClass, CCInteger, Component, Enum, instantiate, js, Node, Prefab } from "cc";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { CC_EnumList, CC_IEnumable, CC_IEnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable'
import { pConst } from "db://pts-core/scripts/utils";
import { Bundle_Manager } from "../../bundle/Bundle.Manager";
import { UI_IBase, UI_ICloseOpt, UI_IOpenOpt } from "../../../interfaces/Components/UI/UI.IBase";
import { UI_IController } from "db://pts-bundle-list/interfaces/Components/UI/UI.IController";
import { Helper_UI_Loader } from "db://pts-core/scripts/helper/UI/Helper.UI.Loader";
import { editor_property } from "db://pts-core/scripts/utils/pClass";
import { Helper_IdSelector } from "db://pts-core/scripts/helper/Helper.IdSelector";
import { Event_Flexer } from "db://pts-core/scripts/Components/Event/Event.Flexer";
import { DEV } from "cc/env";

const { ccclass, property } = _decorator;

interface _$IData {
    bundle: string
    type: string
    path: string
    max: number
}

@ccclass("_Bridge_Asseter")
class _Bridge_Asseter {

    @property({ type: Enum({}), group: pConst.GROUPS.EDITOR })
    get bundle() { return this._bundle }
    set bundle(x) {
        this._bundle = x;
        this._actUpdateType();
    }

    @property({ visible() { return this._bundle }, readonly: true, group: pConst.GROUPS.DETAIL })
    protected _bundle: string = ''

    @property({ visible() { return this._type }, readonly: true, group: pConst.GROUPS.DETAIL })
    protected _type: string = ''

    @property({ type: Enum({}), group: pConst.GROUPS.EDITOR })
    get type() { return this._type }
    set type(x) {
        this._type = x
        this._actUpdateAsset();
    }

    @property({ visible() { return this._asset }, readonly: true, group: pConst.GROUPS.DETAIL })
    protected _asset: string = ''
    @property({ type: Enum({}), group: pConst.GROUPS.EDITOR })
    get asset() { return this._asset }
    set asset(x) {
        this._asset = x
    }
    protected _manager: Bundle_Manager<any>;

    protected _actUpdateType() {
        if(!this._manager) return;

        const _type = this._manager.all[this._bundle];
        if(!_type) return;

        const _types = Object.keys(_type).map(_ => ({ name: _, value: _ }))
        CCClass.Attr.setClassAttr(this, 'type', 'enumList', _types)
    }

    protected _actUpdateAsset() {
        if(!this._manager) return;

        const _type = this._manager.all[this._bundle];
        if(!_type) return;

        const _asset = _type[this._type]
        if(!_asset) return;

        const _types = Object.keys(_asset).map(_ => ({ name: _, value: _ }))
        CCClass.Attr.setClassAttr(this, 'asset', 'enumList', _types)
    }

    focus(ref: Bundle_Manager<any>, hides: (keyof _Bridge_Asseter)[] = []) {
        this._manager = ref;

        const _keys = Object.keys(this._manager.all).map(_ => ({ name: _, value: _ }));

        CCClass.Attr.setClassAttr(this, 'bundle', 'enumList', _keys)
        for(const _hide of hides) {
            CCClass.Attr.setClassAttr(this, _hide, 'visible', false);
        }
        this._actUpdateAsset();
    }

    get() {
        return {
            bundle: this._bundle,
            type: this._type,
            path: this._asset,
        }
    }
}

type _$IOpenOpt<_T_UI_Id extends pFlex.TKey> = {
    id: _T_UI_Id;
    loading: boolean
} | _T_UI_Id;

@ccclass("_Bridge_Converter")
class _Bridge_Converter<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> {

    @property({ type: Enum({}), group: pConst.GROUPS.EDITOR })
    get ui() { return this._ui }
    set ui(v) { this._ui = v }

    @property({ type: CCInteger, min: 0 })
    intMaxInstance: number = 1

    @property({ visible() { return this._ui }, readonly: true, group: pConst.GROUPS.DETAIL })
    protected _ui: _T_UI_Id = '' as _T_UI_Id

    @property({ type: _Bridge_Asseter, group: pConst.GROUPS.EDITOR })
    asseter: _Bridge_Asseter = new _Bridge_Asseter();

    focus(ref: UI_Controller<_T_UI_Id, _TAll>) {
        CCClass.Attr.setClassAttr(this, 'ui', 'enumList', ref?.list || []);
        this.asseter.focus(ref?.bundle);
    }

    is(ui: _T_UI_Id) { return ui === this._ui }
    get(): _$IData {
        return {
            ...this.asseter.get(),
            max: this.intMaxInstance
        }
    }

}

@ccclass("_Bridge_UIToAsset")
class _Bridge_UIToAsset<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> {
    @property({ type: Component, readonly: true })
    ref: UI_Controller<_T_UI_Id, _TAll> = null

    @property({  })
    get actAutoGen() { return false }
    set actAutoGen(x) {
        if(!x) return;
        if(!this.ref) return;

        this.ref.list.forEach(_ui => {
            const _lookup = this._converters.find(_cv => _cv.ui == _ui.value);
            if(!!_lookup) return;

            const _ret = new _Bridge_Converter<_T_UI_Id, _TAll>();
            _ret.ui = _ui.value;
            this._converters.push(_ret);
        });
    }

    @property([_Bridge_Converter])
    protected _converters: _Bridge_Converter<_T_UI_Id, _TAll>[] = []
    @property([_Bridge_Converter])
    get converters() { return this._converters }
    set converters(x) {
        this._converters = x;
        this.focus(this.ref);
    }

    protected _$map = js.createMap<Record<any, _$IData>>(true);
    convert(ui: _T_UI_Id): _$IData | undefined {
        let _out = this._$map[ui];
        if(!!_out) return _out;

        this.init();
        return this._$map[ui]
    }

    focus(ref: UI_Controller<_T_UI_Id, _TAll>) {
        if(!ref) return;
        this.ref = ref;

        this._converters.forEach(_ => _.focus(ref))
    }

    init() {
        for(const _ret of this._converters) {
            this._$map[_ret.ui] = _ret.get();
        }
    }
}

const _$pool = js.createMap(true);

type _TPram = {
    open: pFlex.TFunc<[pFlex.TKey], void>
    close: pFlex.TFunc<[pFlex.TKey], void>
}

@ccclass("UI_Controller._Helper")
class _Helper<_T_UI_Id extends pFlex.TKey> extends Event_Driver.Helper<keyof _TPram> {
    @property({ type: Enum({}), displayOrder: 0 })
    id: _T_UI_Id = "" as _T_UI_Id

    emit(key: _T_UI_Id, ...args: any[]): any[] {
        if(key != this.id) return;
        return this.flex.emit(this.id, ...args);
    }

}

@ccclass("UI_Controller._BundleLoader")
class _BundleLoader {
    @property({})
    protected _bundle: string = ""

    @property({ type: Enum({}) })
    get bundle() { return this._bundle }
    set bundle(x) { this._bundle = x }

    @property({ type: Event_Flexer })
    onLoaded: Event_Flexer = new Event_Flexer();

    protected _manager: Bundle_Manager<any> = null;

    focus(ref: Bundle_Manager<any>) {
        this._manager = ref;

        const _keys = Object.keys(this._manager.all).map(_ => ({ name: _, value: _ }));

        CCClass.Attr.setClassAttr(this, 'bundle', 'enumList', _keys)
    }

    append(ref: Bundle_Manager<any>) {
        if(!ref) return;
        this._manager = ref;
        this._manager.wait(this._bundle).then(_ => this.onLoaded.emit(_));
    }
}

@ccclass("UI_Controller")
export abstract class UI_Controller<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> extends Event_Driver<_TPram> implements UI_IController<_T_UI_Id, _TAll> {
    protected static _$bounces = ['open', 'close'] as const;
    protected static _$class = _Helper;

    static get(id: string) {
        return _$pool[id] as UI_Controller<any, any> | undefined;
    }

    static register(who: UI_Controller<any, any>) {
        if(!who) return;
        _$pool[who.sid.sid] = who;
    }

    @property({ type: Helper_IdSelector, group: pConst.GROUPS.CORE })
    sid: Helper_IdSelector = new Helper_IdSelector();

    @property({ type: Node, group: pConst.GROUPS.CORE })
    screen: Node = null

    @property({ type: Node, group: pConst.GROUPS.OPTION })
    dark: Node = null

    @property({ type: Node, group: pConst.GROUPS.CORE })
    popup: Node = null

    @property({ type: Helper_UI_Loader, group: pConst.GROUPS.OPTION, visible: true })
    loading: Helper_UI_Loader = new Helper_UI_Loader();

    @property({ group: pConst.GROUPS.OPTION, type: Enum({}) })
    landing: _T_UI_Id = '' as _T_UI_Id;

    @property({ type: _BundleLoader, group: pConst.GROUPS.EVENT })
    onBundlesLoaded: _BundleLoader[] = []

    protected abstract _bundle: Bundle_Manager<_TAll>;
    get bundle() { return this._bundle }

    @property({ type: _Bridge_UIToAsset, group: pConst.GROUPS.EDITOR })
    protected bridge: _Bridge_UIToAsset<_T_UI_Id, _TAll> = new _Bridge_UIToAsset()

    protected _loader: Map<_T_UI_Id, Promise<Asset>> = new Map();
    protected _pool: Map<_T_UI_Id, UI_IBase<_T_UI_Id, any>[]> = new Map()
    protected _pending: Map<_T_UI_Id, number> = new Map()

    @editor_property()
    protected _scene: _T_UI_Id = "" as _T_UI_Id

    protected abstract _list: CC_IEnumList<_T_UI_Id, _T_UI_Id>[]  | CC_IEnumable<_T_UI_Id> | _T_UI_Id[]
    get list() { return CC_EnumList(this._list) }

    protected __preload(): void {
        super.__preload();
        this._actSetupLoading();

        this.dark && ( this.dark.active = false )
        UI_Controller.register(this);

        this._actApplyBundleWaiter();
    }

    protected _actApplyBundleWaiter() {
        if(!this.bundle) return;
        for(const _waiter of this.onBundlesLoaded) {
            if(!_waiter) continue;

            _waiter.append(this.bundle);
        }
    }

    protected _actSetupLoading() {
        this.loading.init();
    }

    protected onLoad(): void {
        if(!this.bundle) {
            return;
        }

        this.bridge.init();
    }

    protected onEnable(): void {
        this.open(this.landing)
    }

    onFocusInEditor(): void {
        super.onFocusInEditor();

        CCClass.Attr.setClassAttr(this, 'landing', 'enumList', this.list || []);
        this.helpers.forEach(_ => CCClass.Attr.setClassAttr(_, 'id', 'enumList', this.list || []));
        this.bridge.focus(this);
        this.onBundlesLoaded.forEach(_ => _.focus(this.bundle));
    }

    resetInEditor(): void {
        if(!this._list) {
            this.destroy();

            console.warn("[UI_Controller].{resetInEditor} >> WARN: Should initiate the `_list`")
            return;
        }
        this.onFocusInEditor();
    }

    protected async _open<_TWho extends UI_IBase<_T_UI_Id, any>>(_id: _T_UI_Id, _loading: boolean, _data: _$IData, params: Parameters<_TWho['open']>, _uis?: _TWho[]) {
        _loading && this.loading.show(true);

        if(!_data) {
            console.warn("[UI_Controller].{open} >> WARN: Invalid Id");
            return null;
        }

        let _prm = this._loader.get(_id);
        if(!_prm) {
            _prm = this.bundle.get(_data.bundle, _data.type, _data.path);
            this._loader.set(_id, _prm);
        }

        const _prefab = await _prm;
        if(!(_prefab instanceof Prefab)) {
            console.warn('[UI_Controller].{open} >> WARN: Invalid Typeof Asset', "\nAsset: ", _prefab);
            return null;
        }

        const _node = instantiate(_prefab);
        let _ui = _node.getComponent(UI_IBase.CCClass) as (Component & _TWho) | null;
        if(!_ui) {
            _node.destroy()
            console.warn('[UI_Controller].{open} >> WARN: Asset does not contain UI_IBase', "\nComponent: ", _ui);
            return null;
        }

        _node.once(Node.EventType.NODE_DESTROYED, (_: Node) => {
            this._loader.delete(_id);
            this._pool.delete(_id);
        })

        _ui.link(this);
        if (_uis && !_uis.includes(_ui)) {
            _uis.push(_ui);
        }

        const _papa = _ui.isPopup ? this.popup : this.screen;
        _papa.addChild(_node);

        _loading && this.loading.show(false);

        try {
            await _ui.open(...params);
        } catch (err) {
            if (_uis) {
                const _idx = _uis.indexOf(_ui);
                if (_idx !== -1) _uis.splice(_idx, 1);
            }
            _node.destroy();
            throw err;
        }

        return _ui;
    }

    async open<_TWho extends UI_IBase<_T_UI_Id, any>>(opt: _$IOpenOpt<_T_UI_Id>, ...params: Parameters<_TWho['open']>) {
        const [_id, _loading] = (typeof opt === 'object' ? [opt.id, opt.loading] : [opt, true]) as [_T_UI_Id, boolean];

        const _data = this.bridge.convert(_id);
        if(!_data) {
            console.warn("[UI_Controller].{open} >> WARN: Invalid Id");
            return [];
        }

        let _uis = this._pool.get(_id) as _TWho[];
        if(!_uis) {
            _uis = [];
            this._pool.set(_id, _uis);
        }

        const _pending = this._pending.get(_id) ?? 0;

        // Increment pending BEFORE the guard check's await, to prevent race conditions
        // where multiple concurrent open() calls all read _pending=0 and bypass the max limit.
        this._pending.set(_id, _pending + 1);

        if(_data.max > 0 && _uis.length + _pending >= _data.max) {
            this._pending.set(_id, (this._pending.get(_id) ?? 1) - 1);
            const _promises: Promise<any>[] = [];
            for(const _ui of _uis) {
                if(_ui && _ui.isValid) {
                    !_ui.isOpening && _promises.push(_ui.open(...params));
                }
                console.log("[UI_Controller].{open} >> WARN: Max instance reached for UI", _id, " (max:", _data.max, ", current:", _uis.length, ", pending:", _pending, ")", _ui);
            }
            await Promise.all(_promises);
            this.emit('open', _id);
            return _uis;
        }
        //this._pending.set(_id, _pending + 1);

        try {
            const _out: _TWho = await this._open(_id, _loading, _data, params, _uis);
            if(_out && !_uis.includes(_out)) _uis.push(_out);
        } finally {
            this._pending.set(_id, (this._pending.get(_id) ?? 1) - 1);
        }

        this.emit('open', _id);
        return _uis;
    }

    async close<_TWho extends UI_IBase<_T_UI_Id, any>>(id: _T_UI_Id, ...params: Parameters<_TWho["close"]>): Promise<void> {
        const _uis = this._pool.get(id);
        if(!_uis) return;

        this.loading.show(true);

        await Promise.all(_uis.map(_ => _ && _.isValid && _.close(...params)));
        this.loading.show(false);
        this.emit('close', id);
    }

    get(id: _T_UI_Id) {
        const _uis = (this._pool.get(id) ?? []) as UI_IBase<_T_UI_Id, any>[];
        return _uis.filter(_ui => _ui && _ui.isValid);
    }

    preload(id: pFlex.TArray<_T_UI_Id>, ...ids: _T_UI_Id[]) {
        const _ids: _T_UI_Id[] = Array.isArray(id) ? [...id, ...ids] : [id, ...ids];
        for(const _id of _ids) {
            if(this._loader.has(_id)) continue;
            const _data = this.bridge.convert(_id);
            if(!_data) continue;
            this._loader.set(_id, this.bundle.get(_data.bundle, _data.type, _data.path));
        }
    }

    setup(target: UI_IBase<_T_UI_Id, any>, open: false, opt: UI_ICloseOpt): void;
    setup(target: UI_IBase<_T_UI_Id, any>, open: true, opt: UI_IOpenOpt<_T_UI_Id>): void;
    setup(target: UI_IBase<_T_UI_Id, any>, open: boolean, opt: UI_ICloseOpt | UI_IOpenOpt<_T_UI_Id>): void {
        open ? this._onOpenUI(target, opt as UI_IOpenOpt<_T_UI_Id>) : this._onCloseUI(target, opt as UI_ICloseOpt);
    }

    protected _updateDarkState(target?: UI_IBase<_T_UI_Id, any>, isOpening?: boolean): void {
        if(!this.dark) return;

        let _is = false;
        if(target && target.isValid && target.isPopup && isOpening) {
            _is = true;
        }

        if(!_is) {
            this._pool.forEach(_uis => {
                for(const _ui of _uis) {
                    if(_ui && _ui.isValid && _ui.isPopup) {
                        const _opening = (_ui === target) ? isOpening : _ui.isOpening;
                        if(_opening) {
                            _is = true;
                            return;
                        }
                    }
                }
            });
        }

        this.dark.active = _is;
    }

    protected _onOpenUI(target: UI_IBase<_T_UI_Id, any>, opt: UI_IOpenOpt<_T_UI_Id>) {
        if(!target || !target.isValid) return;

        if(!target.isPopup) {
            if(this._scene && this._scene !== target.tid) {
                target.setBackUp([this._scene], true);
            }
            this._scene = target.tid;

            if(this.screen) {
                const _others = this.screen.getComponentsInChildren(UI_IBase.CCClass) as (Component & UI_IBase<_T_UI_Id, any>)[];
                for(const _other of _others) {
                    if(_other && _other.isValid && _other !== target && !_other.isPopup && _other.isOpening) {
                        _other.close({ isNotOpenBackUp: true });
                    }
                }
            }
        }

        if(opt) {
            const { arrBackUpPermantly, isOnTop, layer, arrBackUpOnce } = opt;

            if(layer) {
                target.root.layer = layer;
            }

            if(isOnTop) {
                const _papa = target.isPopup ? this.popup : this.screen;
                const _max = _papa.children.length;

                target.setDrawOrder(_max);
            }

            arrBackUpPermantly && target.setBackUp(arrBackUpPermantly, false);
            arrBackUpOnce && target.setBackUp(arrBackUpOnce, true);
        }

        this._updateDarkState(target, true);
    }

    protected _onCloseUI(target: UI_IBase<_T_UI_Id, any>, opt: UI_ICloseOpt) {
        if(!target || !target.isValid) return;

        const { isNotOpenBackUp, isForceDestroy } = opt || { isNotOpenBackUp: false, isForceDestroy: false };

        console.log("[UI_Controller] _onCloseUI >>", target.tid, " isNotOpenBackUp: ", isNotOpenBackUp, " isForceDestroy: ", isForceDestroy, opt);
        !isNotOpenBackUp && target.actOpenBackUp();

        const _shouldDestroy = isForceDestroy || target.shouldDestroyOnClose;
        if(_shouldDestroy) {
            const _uis = this._pool.get(target.tid);
            if(_uis) {
                const _idx = _uis.indexOf(target);
                if(_idx !== -1) _uis.splice(_idx, 1);
            }
            target.actDestroyCompletly();
        }

        this._updateDarkState(target, false);
    }

    protected update(dt: number): void {
        this.loading.update(dt);
    }
}

export namespace UI_Controller {
    export const Bridge = _Bridge_Asseter;
    export type Bridge = _Bridge_Asseter;
}

DEV && (globalThis['UI_Controller'] = UI_Controller, UI_Controller['_$pool_'] = _$pool);
