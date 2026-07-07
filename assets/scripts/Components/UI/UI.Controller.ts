import { _decorator, CCClass, Component, Enum, Node } from "cc";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { UI_IBase } from "db://pts-asset/interfaces/Components/UI/UI.IBase";
import { Asset_Manager } from "../Assets/Assets.Manager";
import { CC_IEnumable, CC_IEnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable'
import { EDITOR } from "cc/env";
import { pConst } from "db://pts-core/scripts/utils";

const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("_Bridge_Asseter")
class _Bridge_Asseter {

    @property({ type: Component, readonly: true })
    ref: UI_Controller<any, any> = null

    @property({ visible() { return this._bundle }, readonly: true })
    protected _bundle: string = ''

    @property({ type: Enum({}) })
    get bundle() { return this._bundle }
    set bundle(x) {
        this._bundle = x;
        if(!this.ref?.bundle) return;

        const _all = this.ref.bundle.all[x];
        if(!_all) return;

        const _valid = Object.values(_all).find(Boolean);
        console.log(" >> OUT ", _valid, _all)
        if(!_valid) return;

        const _types = Object.keys(_valid).map(_ => ({ name: _, value: _ }))
        CCClass.Attr.setClassAttr(_Bridge_Asseter, 'type', 'enumList', _types)
    }

    @property({ visible() { return this._type }, readonly: true })
    protected _type: string = ''

    @property({ type: Enum({}) })
    get type() { return this._type }
    set type(x) {
        this._type = x
    }

    @property({ visible() { return this._asset }, readonly: true })
    protected _asset: string = ''
    @property({ type: Enum({}) })
    get asset() { return this._asset }
    set asset(x) {
        this._asset = x
    }

    focus(ref: UI_Controller<any, any>) {
        this.ref = ref;

        if(!this.ref?.bundle) return;

        const _keys = Object.keys(this.ref.bundle.all).map(_ => ({ name: _, value: _ }));

        CCClass.Attr.setClassAttr(_Bridge_Asseter, 'bundle', 'enumList', _keys)
    }

}

@ccclass("_Bridge_Converter")
class _Bridge_Converter<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> {
    @property({ visible() { return this._ui }, readonly: true })
    protected _ui: _T_UI_Id = '' as _T_UI_Id

    @property({ type: Enum({}) })
    get ui() { return this._ui }
    set ui(v) { this._ui = v }

    @property({ type: _Bridge_Asseter })
    asseter: _Bridge_Asseter = new _Bridge_Asseter();

    focus(ref: UI_Controller<_T_UI_Id, _TAll>) {
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

    @property([_Bridge_Converter])
    protected _conveters: _Bridge_Converter<_T_UI_Id, _TAll>[] = []
    @property([_Bridge_Converter])
    get conveters() { return this._conveters }
    set conveters(x) {
        this._conveters = x;
        this._conveters.forEach(_ => _.focus(this.ref))
    }

    focus(ref: UI_Controller<_T_UI_Id, _TAll>) {
        if(!ref) return;
        this.ref = ref;

        let _list: CC_IEnumList<_T_UI_Id, _T_UI_Id>[] = []
        if(CC_IEnumable(ref.list)) {
            for(const [k, v] of Object.entries(ref.list)) {
                if(k === '__enums__') continue;
                _list.push({ name: k as _T_UI_Id, value: v })
            }
        } else if (CC_IEnumList(ref.list)) {
            _list = ref.list
        } else {
            for(const ret of ref.list) {
                _list.push({ name: ret, value: ret })
            }
        }

        CCClass.Attr.setClassAttr(_Bridge_Converter, 'ui', 'enumList', _list);
        this._conveters.forEach(_ => _.focus(ref))
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

    @property({ type: Asset_Manager })
    protected _bundle: Asset_Manager<_TAll> = null

    @property({ type: Asset_Manager, group: pConst.GROUPS.CORE })
    get bundle() { return this._bundle }
    set bundle(x) {
        this._bundle = x;
        this.onFocusInEditor();
    }

    @property({ type: _Bridge_UIToAsset, group: pConst.GROUPS.EDITOR })
    protected bridge: _Bridge_UIToAsset<_T_UI_Id, _TAll> = new _Bridge_UIToAsset()

    protected _loader: Map<_T_UI_Id, Promise<UI_IBase<_T_UI_Id, any>>> = new Map();
    protected _pool: Map<_T_UI_Id, UI_IBase<_T_UI_Id, any>> = new Map()

    protected abstract _list: CC_IEnumList<_T_UI_Id, _T_UI_Id>[]  | CC_IEnumable<_T_UI_Id> | _T_UI_Id[]
    get list() { return this._list }

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
