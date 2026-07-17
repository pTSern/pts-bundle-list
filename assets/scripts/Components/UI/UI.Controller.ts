import { _decorator, CCClass, Component, Enum, Node } from "cc";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { CC_EnumList, CC_IEnumable, CC_IEnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable'
import { EDITOR } from "cc/env";
import { pConst } from "db://pts-core/scripts/utils";
import { Bundle_Manager } from "../../bundle/Bundle.Manager";
import { UI_IBase } from "../../../interfaces/Components/UI/UI.IBase";

const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("_Bridge_Asseter")
class _Bridge_Asseter {
    @property({ type: Enum({}), group: pConst.GROUPS.EDITOR })
    get bundle() { return this._bundle }
    set bundle(x) {
        this._bundle = x;
        this._actUpdateType();
    }

    @property({ type: Component, readonly: true, group: pConst.GROUPS.DETAIL })
    ref: UI_Controller<any, any> = null

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

    protected _actUpdateType() {
        if(!this.ref?.bundle) return;

        const _type = this.ref.bundle.all[this._bundle];
        if(!_type) return;

        const _types = Object.keys(_type).map(_ => ({ name: _, value: _ }))
        CCClass.Attr.setClassAttr(this, 'type', 'enumList', _types)
    }

    protected _actUpdateAsset() {
        if(!this.ref?.bundle) return;

        const _type = this.ref.bundle.all[this._bundle];
        if(!_type) return;

        const _asset = _type[this._type]
        if(!_asset) return;

        const _types = Object.keys(_asset).map(_ => ({ name: _, value: _ }))
        CCClass.Attr.setClassAttr(this, 'asset', 'enumList', _types)
    }

    focus(ref: UI_Controller<any, any>) {
        this.ref = ref;

        console.log(">> DATA", this.ref.bundle)
        if(!this.ref?.bundle) return;

        const _keys = Object.keys(this.ref.bundle.all).map(_ => ({ name: _, value: _ }));

        CCClass.Attr.setClassAttr(this, 'bundle', 'enumList', _keys)
        this._actUpdateType();
        this._actUpdateAsset();
    }

}

@ccclass("_Bridge_Converter")
class _Bridge_Converter<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> {

    @property({ type: Enum({}), group: pConst.GROUPS.EDITOR })
    get ui() { return this._ui }
    set ui(v) { this._ui = v }

    @property({ visible() { return this._ui }, readonly: true, group: pConst.GROUPS.DETAIL })
    protected _ui: _T_UI_Id = '' as _T_UI_Id

    @property({ type: _Bridge_Asseter, group: pConst.GROUPS.EDITOR })
    asseter: _Bridge_Asseter = new _Bridge_Asseter();

    focus(ref: UI_Controller<_T_UI_Id, _TAll>) {
        CCClass.Attr.setClassAttr(this, 'ui', 'enumList', ref?.list || []);
        this.asseter.focus(ref);
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

    focus(ref: UI_Controller<_T_UI_Id, _TAll>) {
        if(!ref) return;
        this.ref = ref;

        this._converters.forEach(_ => _.focus(ref))
    }

    init() {

    }
}

@ccclass("UI_Controller")
@executeInEditMode()
export abstract class UI_Controller<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> extends Event_Driver<{}> {

    @property({ type: Node, group: pConst.GROUPS.CORE })
    screen: Node = null

    @property({ type: Node, group: pConst.GROUPS.CORE })
    popup: Node = null

    @property({ type: Node, group: pConst.GROUPS.OPTION })
    loading: Node = null

    protected abstract _bundle: Bundle_Manager<_TAll>;
    get bundle() { return this._bundle }

    @property({ type: _Bridge_UIToAsset, group: pConst.GROUPS.EDITOR })
    protected bridge: _Bridge_UIToAsset<_T_UI_Id, _TAll> = new _Bridge_UIToAsset()

    protected _loader: Map<_T_UI_Id, Promise<UI_IBase<_T_UI_Id, any>>> = new Map();
    protected _pool: Map<_T_UI_Id, UI_IBase<_T_UI_Id, any>> = new Map()

    protected abstract _list: CC_IEnumList<_T_UI_Id, _T_UI_Id>[]  | CC_IEnumable<_T_UI_Id> | _T_UI_Id[]
    get list() { return CC_EnumList(this._list) }

    protected __preload(): void {
        if(!this._list) {
            this.destroy();

            console.warn("[UI.Controller] >> Should initiate the `_list`")
            return;
        }
    }

    protected onLoad(): void {
        this.onFocusInEditor();

        if(!this.bundle) {

            return;
        }
    }

    onFocusInEditor(): void {
        if(!EDITOR) return;
        this.bridge.focus(this);
        console.log("onFocus")
    }

    open<_TWho extends UI_IBase<_T_UI_Id, any>>(id: _T_UI_Id, ...params: Parameters<_TWho['open']>) {
        let _ui = this._pool.get(id);

        if(_ui) {

        }

        return _ui;
    }

    close() {

    }

    get(id: _T_UI_Id) {

    }

    preload(id: pFlex.TArray<_T_UI_Id>, ...ids: _T_UI_Id[]) {

    }

}
