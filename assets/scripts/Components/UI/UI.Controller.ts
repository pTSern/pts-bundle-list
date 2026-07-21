import { _decorator, Asset, CCClass, CCString, Component, Enum, instantiate, js, Node, Prefab, warn } from "cc";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { CC_EnumList, CC_IEnumable, CC_IEnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable'
import { EDITOR } from "cc/env";
import { pAsync, pConst } from "db://pts-core/scripts/utils";
import { Bundle_Manager } from "../../bundle/Bundle.Manager";
import { UI_IBase, UI_ICloseOpt, UI_IOpenOpt } from "../../../interfaces/Components/UI/UI.IBase";
import { UI_IController } from "db://pts-bundle-list/interfaces/Components/UI/UI.IController";
import { Helper_UI_Loader } from "db://pts-core/scripts/helper/UI/Helper.UI.Loader";
import { editor_property } from "db://pts-core/scripts/utils/pClass";

const { ccclass, property, executeInEditMode } = _decorator;

interface _IData {
    bundle: string
    type: string
    path: string
}

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

    get(): _IData {
        return {
            bundle: this._bundle,
            type: this._type,
            path: this._asset
        }
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

    is(ui: _T_UI_Id) { return ui === this._ui }
    get() {
        return this.asseter.get()
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

    protected _$map = js.createMap<Record<any, _IData>>(true);
    convert(ui: _T_UI_Id): _IData | undefined {
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
        console.log("[_Bridge_UIToAsset].{init} >> Done Inited: ", this)
    }
}

@ccclass("UI_Controller")
@executeInEditMode()
export abstract class UI_Controller<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> extends Event_Driver<{}> implements UI_IController<_T_UI_Id, _TAll> {

    @property({ type: Node, group: pConst.GROUPS.CORE })
    screen: Node = null

    @property({ type: Node, group: pConst.GROUPS.CORE })
    popup: Node = null

    @property({ type: Helper_UI_Loader, group: pConst.GROUPS.OPTION, visible: true })
    loading: Helper_UI_Loader = new Helper_UI_Loader();

    protected abstract _bundle: Bundle_Manager<_TAll>;
    get bundle() { return this._bundle }

    @property({ type: _Bridge_UIToAsset, group: pConst.GROUPS.EDITOR })
    protected bridge: _Bridge_UIToAsset<_T_UI_Id, _TAll> = new _Bridge_UIToAsset()

    protected _loader: Map<_T_UI_Id, Promise<Asset>> = new Map();
    protected _pool: Map<_T_UI_Id, UI_IBase<_T_UI_Id, any>> = new Map()

    @editor_property()
    protected _scene: _T_UI_Id = "" as _T_UI_Id

    protected abstract _list: CC_IEnumList<_T_UI_Id, _T_UI_Id>[]  | CC_IEnumable<_T_UI_Id> | _T_UI_Id[]
    get list() { return CC_EnumList(this._list) }

    protected __preload(): void {
        if(!this._list) {
            this.destroy();

            console.warn("[UI.Controller] >> Should initiate the `_list`")
            return;
        }

        this._actSetupLoading();
    }

    protected _actSetupLoading() {
        this.loading.init();
    }

    protected onLoad(): void {
        this.onFocusInEditor();

        if(!this.bundle) {

            return;
        }

        this.bridge.init();
    }

    onFocusInEditor(): void {
        if(!EDITOR) return;
        this.bridge.focus(this);
        console.log("onFocus")
    }

    async open<_TWho extends UI_IBase<_T_UI_Id, any>>(id: _T_UI_Id, ...params: Parameters<_TWho['open']>) {
        console.groupCollapsed("[UI_Controller].{open} >> Start Opening", "\nId: ", id, "\nParams: ", params, "\nThis: ", this);

        let _ui = this._pool.get(id) as _TWho | undefined;
        if(!!_ui?.isOpening) {
            console.log("UI is already opended", _ui);
            console.groupEnd();
            return _ui
        }
        this.loading.show(true);

        if(!_ui) {
            const _data = this.bridge.convert(id);
            if(!_data) {
                console.warn("WARN >> Invalid Id");
                console.groupEnd();
                return null;
            }

            let _prm = this._loader.get(id);
            if(!_prm) {
                _prm = this.bundle.get(_data.bundle, _data.type, _data.path);
            }
            const _prefab = await _prm;
            if(!(_prefab instanceof Prefab)) {
                console.warn('WARN >> Invalid Typeof Asset', "\nAsset: ", _prefab);
                console.groupEnd();
                return null;
            }

            const _node = instantiate(_prefab);
            _ui = _node.getComponent(UI_IBase.CCClass) as (Component & _TWho) | null;
            if(!_ui) {
                _node.destroy()
                console.warn('WARN >> Asset does not contain UI_IBase', "\nComponent: ", _ui);
                console.groupEnd();
                return null;
            }

            _ui.link(this);

            this._pool.set(id, _ui);

            const _papa = _ui.isPopup ? this.popup : this.screen;
            _papa.addChild(_node);
        }

        //@ts-ignore disable eslint
        await _ui.open(...params);

        console.log("LOADED", _ui);
        console.groupEnd();

        this.loading.show(false);
        return _ui;
    }

    async close<_TWho extends UI_IBase<_T_UI_Id, any>>(id: _T_UI_Id, ...params: Parameters<_TWho["close"]>): Promise<void> {
        const _ui = this._pool.get(id);
        if(!_ui) return;
        if(!_ui.isOpening) return;

        this.loading.show(true);

        //@ts-ignore disable eslint
        await _ui.close(...params);
        this.loading.show(false);
    }

    get(id: _T_UI_Id) {

    }

    preload(id: pFlex.TArray<_T_UI_Id>, ...ids: _T_UI_Id[]) {

    }

    setup(target: UI_IBase<_T_UI_Id, any>, open: false, opt: UI_ICloseOpt): void;
    setup(target: UI_IBase<_T_UI_Id, any>, open: true, opt: UI_IOpenOpt<_T_UI_Id>): void;
    setup(target: UI_IBase<_T_UI_Id, any>, open: boolean, opt: UI_ICloseOpt | UI_IOpenOpt<_T_UI_Id>): void {
        open ? this._onOpenUI(target, opt as UI_IOpenOpt<_T_UI_Id>) : this._onCloseUI(target, opt as UI_ICloseOpt);
    }

    protected _onOpenUI(target: UI_IBase<_T_UI_Id, any>, opt: UI_IOpenOpt<_T_UI_Id>) {
        if(!target || !target.isValid) return;

        const { arrBackUpPermantly, isOnTop, layer, arrBackUpOnce } = opt;

        if(!target.isPopup) {
            this._scene && target.setBackUp([this._scene], true);
            this._scene = target.tid;
        }

        if(layer) {
            target.root.layer = layer;
        }

        if(isOnTop) {
            const _papa = target.isPopup ? this.popup : this.screen;
            const _max = _papa.children.length;

            target.setDrawOrder(_max);
        }

        arrBackUpPermantly && target.setBackUp(arrBackUpPermantly, false);
        arrBackUpOnce && target.setBackUp(arrBackUpOnce, true)
    }

    protected _onCloseUI(target: UI_IBase<_T_UI_Id, any>, opt: UI_ICloseOpt) {
        if(!target || !target.isValid) return;

        const { isNotOpenBackUp, isForceDestroy } = opt;

        !isNotOpenBackUp && target.actOpenBackUp();
        isForceDestroy && target.actDestroyCompletly();
    }

    protected update(dt: number): void {
        this.loading.update(dt);
    }
}
