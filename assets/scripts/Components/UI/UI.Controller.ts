import { _decorator, CCClass, Enum, Node } from "cc";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { UI_IBase } from "db://pts-asset/interfaces/Components/UI/UI.IBase";
import { Asset_Manager } from "../Asets/Assets.Manager";
import { CC_IEnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable'

const { ccclass, property } = _decorator;

@ccclass("_Bridge_Asseter")
class _Bridge_Asseter {

}

@ccclass("_Bridge_Converter")
class _Bridge_Converter<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> {
    @property({ visible: true })
    protected _ui: _T_UI_Id = 0 as _T_UI_Id
    @property({ type: Enum({}) })
    get ui() { return this._ui }
    set ui(v) {
        this._ui = v;

    }

}

@ccclass("_Bridge_UIToAsset")
class _Bridge_UIToAsset<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> {
    @property([_Bridge_Converter])
    conveter: _Bridge_Converter<_T_UI_Id, _TAll>[] = []


    focus(ref: UI_Controller<_T_UI_Id, _TAll>) {
        if(!ref) return;

        CCClass.Attr.setClassAttr(_Bridge_Converter, 'ui', 'enumList', ref.list);
    }

    init() {

    }
}

@ccclass("UI_Controller")
export abstract class UI_Controller<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> extends Event_Driver<{}> {

    @property({ type: Node })
    screen: Node = null

    @property({ type: Node })
    popup: Node = null

    @property({ type: Node })
    loading: Node = null

    @property({ type: Asset_Manager })
    bundle: Asset_Manager<_TAll> = null

    @property({ type: _Bridge_UIToAsset })
    bridge: _Bridge_UIToAsset<_T_UI_Id, _TAll> = new _Bridge_UIToAsset();

    protected _loader: Map<_T_UI_Id, Promise<UI_IBase<_T_UI_Id, any>>> = new Map();
    protected _pool: Map<_T_UI_Id, UI_IBase<_T_UI_Id, any>> = new Map()

    protected abstract _list: CC_IEnumList<_T_UI_Id, _T_UI_Id>[]
    get list() { return this._list }

    protected __preload(): void {
        if(!this._list) {
            this.destroy();

            console.warn("[UI.Controller] >> Should initiate the `_list`")
            return;
        }
    }

    protected onLoad(): void {
        if(!this.bundle) {

            return;
        }
    }

    onFocusInEditor(): void {
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
