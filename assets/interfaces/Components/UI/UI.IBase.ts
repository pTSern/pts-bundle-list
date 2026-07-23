import { pDriver } from "db://pts-core/scripts/utils";
import { js, Layers, Node } from "cc";
import { UI_IController } from "./UI.IController";

export type UI_TParams = {
    open(...args: any[]): any
    close(...args: any[]): any
}

export interface UI_ICloseOpt {
    isForceDestroy?: boolean;
    isNotOpenBackUp?: boolean;
}

export interface UI_IOpenOpt<_TId extends pFlex.TKey> {
    arrBackUpPermantly?: _TId[];
    isOnTop?: boolean
    layer?: Layers.Enum
    arrBackUpOnce?: _TId[];
}

export interface UI_IBase<
    _TId extends pFlex.TKey,
    _TParams extends UI_TParams,
> extends pDriver.IDriver<{ onBeforeOpen: _TParams['open'], onAfterOpen: _TParams['open'], onBeforeClose: _TParams['close'], onAfterClose: _TParams['close'] }> {

    get tid(): _TId;
    get isValid(): boolean;
    get isOpening(): boolean

    root: Node;
    isPopup: boolean;
    shouldTurnOffOnFirstTime: boolean;
    shouldDestroyOnClose: boolean;
    backups: _TId[]

    link(owner: UI_IController<any, any>): void
    open(opt?: UI_IOpenOpt<_TId>, ...args: Parameters<_TParams['open']>): Promise<ReturnType<_TParams['open']>>
    close(opt?: UI_ICloseOpt, ...args: Parameters<_TParams['close']>): Promise<ReturnType<_TParams['close']>>
    setBackUp(id: _TId[], once: boolean): void
    setDrawOrder(zIndex: number): void
    actOpenBackUp(): void
    actDestroyCompletly(): void
}

export const UI_IBase = Object.assign(js.createMap(true), {
    CCClass: "UI_Base"
})
