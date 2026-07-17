import { _decorator, Node } from "cc";
import { pConst } from "db://pts-core/scripts/utils";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { UI_IBase, UI_ICloseOpt, UI_IOpenOpt, UI_TParams } from "../../../interfaces/Components/UI/UI.IBase";

const { ccclass, property } = _decorator;

@ccclass("UI_Base")
export abstract class UI_Base<
    _TId extends pFlex.TKey,
    _TParams extends UI_TParams = UI_TParams,
> extends Event_Driver<{
    onBeforeOpen: _TParams['open'],
    onAfterOpen: _TParams['open'],
    onBeforeClose: _TParams['close'],
    onAfterClose: _TParams['close'] }
> implements UI_IBase<_TId, _TParams> {

    protected abstract _tid: _TId
    abstract get tid(): _TId
    @property({ group: pConst.GROUPS.CORE })
    isPopup: boolean = true;

    @property({ type: Node, group: pConst.GROUPS.CORE })
    root: Node = null

    @property({ group: pConst.GROUPS.OPTION })
    shouldTurnOffOnFirstTime: boolean = false;

    @property({ group: pConst.GROUPS.OPTION })
    shouldDestroyOnClose: boolean = false;

    async open(opt: UI_IOpenOpt<_TId>, ...args: Parameters<_TParams["open"]>): Promise<ReturnType<_TParams["open"]>> {
        this.emit('onBeforeOpen', ...args);
        this._onBeforeOpen?.();

        const _out = await (this._opener ? this._opener(...args) : ( this.root.active = true, pConst.RESOLVER ))
        this.emit('onAfterOpen', ...args);
        this._onAfterOpen?.();

        const { } = opt;

        return _out as ReturnType<_TParams["open"]>;
    }

    async close(opt: UI_ICloseOpt, ...args: Parameters<_TParams["close"]>): Promise<ReturnType<_TParams["close"]>> {
        this.emit('onBeforeClose', ...args);
        this._onBeforeClose?.();

        const _out = await (this._opener ? this._closer(...args) : ( this.root.active = false, pConst.RESOLVER ))
        this.emit('onAfterClose', ...args);
        this._onAfterClose?.();

        return _out as ReturnType<_TParams["close"]>
    }

    protected _opener?(...args: Parameters<_TParams['open']>): Promise<ReturnType<_TParams['open']>>
    protected _closer?(...args: Parameters<_TParams['close']>): Promise<ReturnType<_TParams['close']>>

    protected _onBeforeOpen?(): void
    protected _onAfterOpen?(): void

    protected _onBeforeClose?(): void
    protected _onAfterClose?(): void
}

