import { js, Node } from "cc";
import { Bundle_Manager } from "db://pts-bundle-list/scripts/bundle/Bundle.Manager";
import { UI_IBase, UI_ICloseOpt, UI_IOpenOpt } from "./UI.IBase";

export interface UI_IController<
    _T_UI_Id extends pFlex.TKey,
    _TAll extends Record<string, Record<pFlex.TKey, any>>
> {
    screen: Node;
    popup: Node;
    get isValid(): boolean
    get bundle(): Bundle_Manager<_TAll>;

    open<_TWho extends UI_IBase<_T_UI_Id, any>>(id: _T_UI_Id, ...params: Parameters<_TWho['open']>): Promise<_TWho | null>
    close<_TWho extends UI_IBase<_T_UI_Id, any>>(id: _T_UI_Id, ...params: Parameters<_TWho['close']>): Promise<void>

    setup(target: UI_IBase<_T_UI_Id, any>, open: false, opt: UI_ICloseOpt): void
    setup(target: UI_IBase<_T_UI_Id, any>, open: true, opt: UI_IOpenOpt<_T_UI_Id>): void
    setup(target: UI_IBase<_T_UI_Id, any>, open: boolean, opt: UI_ICloseOpt | UI_IOpenOpt<_T_UI_Id>): void

}

export const UI_IController = Object.assign(js.createMap(true), {
    CCClass: "UI_IController"
})
