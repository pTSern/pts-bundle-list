import { _decorator, CCClass, Component, Enum } from 'cc';
import { DEV } from 'cc/env';
import { Bundle_Manager } from '../../bundle/Bundle.Manager';
import { CC_EnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable';
import { editor_ccclass, editor_property } from 'db://pts-core/scripts/utils/pClass';

const { ccclass, property, menu } = _decorator;

@editor_ccclass('___Bundle_Previewer_pbl')
class _Bundle_Previewer {

    static create(key: string, selector: string) {
        const _ret = new _Bundle_Previewer();
        _ret.name = key;
        _ret.selector = selector;

        return _ret;
    }

    @editor_property()
    name: string = ""

    @editor_property()
    get is_loaded() { return Boolean(this.bundle) }

    @editor_property()
    get deps() { return this.bundle?.deps || "---" }

    @editor_property()
    get total_assets() { return this.bundle?.['_config']?.['assetInfos']?.['_count'] || -1 }

    @editor_property()
    get total_scenes() { return this.bundle?.['_config']?.['scenes']?.['_count'] || -1 }

    @editor_property()
    get total_paths() { return this.bundle?.['_config']?.['paths']?.['_count'] || -1 }

    @editor_property(undefined, { writable: true })
    get actLoadMe() { return Boolean(this.bundle) }
    set actLoadMe(x) {
        if(!x) return;

        const _pool = Bundle_Manager["_$pool"];
        if(!_pool) {
            console.warn('Pool is not existed', Bundle_Manager);
            return;
        }

        const _bundle = _pool[this.selector];
        if(!_bundle) {
            console.warn('Bundle is not existed', _pool);
            return;
        }

        _bundle.load(this.name).then(_ => console.log("DONE >>", _));
    }

    get bundle() {
        const _pool = Bundle_Manager["_$pool"];
        if(!_pool) return null;

        const _bundle = _pool[this.selector];
        if(!_bundle) return null;
        return _bundle.at(this.name);
    }
    selector: string = ''

}

@ccclass('___Assets_Editor_pbl')
@menu("pTS Bundle List/Editor/AssetsPreviewer")
class _Assets_Editor extends Component {
    @property({})
    protected _selector: string = ''

    @property({ type: Enum({}) })
    get selector() { return this._selector }
    set selector(x: string) {
        this._selector = x;
    }

    protected get _bundle() { 
        const _pool = Bundle_Manager['_$pool'];
        if(!_pool) return null;

        const _selector = _pool[this._selector];
        return _selector;
    }

    @editor_property([_Bundle_Previewer], { kill: true })
    protected get __previewer() {
        const _bundle = this._bundle;
        if(!_bundle) return null;
        let _list = this['__$previewer'];

        if(!_list) {
            if(!_bundle.all) return [];

            _list = Object.keys(_bundle.all).map(_ => _Bundle_Previewer.create(_, this._selector))
        }

        return _list;
    }

    protected __preload(): void {
        if(!DEV) {
            this.destroy();
            return;
        }
    }

    onFocusInEditor(): void {
        const _list = Bundle_Manager['_$pool'];
        if(!_list) return;
        const _keys = Object.keys(_list);

        const _ccenum = CC_EnumList(_keys);
        CCClass.Attr.setClassAttr(this, 'selector', 'enumList', _ccenum);
    }

    constructor() {
        super();
        this.onFocusInEditor();
    }

}

_Assets_Editor;
