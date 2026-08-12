import { _decorator, Button, CCString, Component, log, Node } from "cc";
import { pArray, pConst, pEngine } from "db://pts-core/scripts/utils";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { UI_IBase, UI_ICloseOpt, UI_IOpenOpt, UI_TParams } from "../../../interfaces/Components/UI/UI.IBase";
import { UI_IController } from "db://pts-bundle-list/interfaces/Components/UI/UI.IController";
import { editor_property } from "db://pts-core/scripts/utils/pClass";
import { DEV } from "cc/env";

const { ccclass, property } = _decorator;

@ccclass(UI_IBase.CCClass)
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

    abstract backups: _TId[]
    @editor_property([CCString])
    protected _arrBackUpOnce: _TId[] = []

    @editor_property(Component)
    protected _owner: UI_IController<any, any> = null;

    @editor_property()
    get isOpening() { return this._isOpened }

    protected _isOpened: boolean = false;

    link(owner: UI_IController<any, any>): void {
        if(!!this._owner) return;
        this._owner = owner;
    }

    protected _actBindingButton(_target: pFlex.TArray<pEngine.TFlexTarget>, _handlers: pFlex.TArray<pFlex.TFunc>, _capture?: any) {
        pEngine.CompUtils.appends({
            _type: Button.EventType.CLICK,
            _binder: this,
            _options: { _handlers, _target, _capture }
        })
    }

    protected _actBindingButtons(opt: pFlex.TArray<pEngine.IEventTarget>, ...opts: pEngine.IEventTarget[]) {
        opts = pArray.flat(opt, opts);
        pEngine.CompUtils.appends({
            _type: Button.EventType.CLICK,
            _binder: this,
            _options: opts
        })
    }

    protected __preload(): void {
        super.__preload();
        this.backups = pArray.unique(this.backups, _ => _ !== this.tid);
    }

    async open(opt: UI_IOpenOpt<_TId>, ...args: Parameters<_TParams["open"]>): Promise<ReturnType<_TParams["open"]>> {
        if(!this._owner || !this._owner.isValid) return;
        DEV && log('[UI_Base] Open >>', this, " with opt ", opt, ' args ', ...args);

        this.emit('onBeforeOpen', ...args);
        this._onBeforeOpen?.();

        this._isOpened = true;
        this._owner.setup(this, true, opt);

        const _out = this._opener ? await this._opener(...args) : this.root.active = true;
        this.emit('onAfterOpen', ...args);
        this._onAfterOpen?.();

        return _out as ReturnType<_TParams["open"]>;
    }

    actOpenBackUp(): void {
        for(const _id of this.backups) {
            this._owner.open(_id, {});
        }

        for(const _id of this._arrBackUpOnce) {
            this._owner.open(_id, {})
        }

        this._arrBackUpOnce = []
    }

    async close(opt: UI_ICloseOpt, ...args: Parameters<_TParams["close"]>): Promise<ReturnType<_TParams["close"]>> {
        if(!this._owner || !this._owner.isValid) return;
        DEV && log('[UI_Base] Close >>', this, " with opt ", opt, ' args ', ...args);

        this.emit('onBeforeClose', ...args);
        this._onBeforeClose?.();

        this._isOpened = false;
        this._owner.setup(this, false, opt);

        const _out = this._closer ? await this._closer(...args) : this.root.active = false;
        this.emit('onAfterClose', ...args);
        this._onAfterClose?.();

        return _out as ReturnType<_TParams["close"]>
    }

    setDrawOrder(zIndex: number): void {
        this.node && this.node.isValid && this.node.setSiblingIndex(zIndex);
    }

    setBackUp(id: _TId[], once: boolean): void {
        const _target = once ? this._arrBackUpOnce : this.backups
        for(const _id of id) {
            if(_target.includes(_id) || _id === this.tid) return;
            _target.push(_id);
        }
    }

    actDestroyCompletly(): void {
        this.node.destroy();
    }

    protected _opener?(...args: Parameters<_TParams['open']>): Promise<ReturnType<_TParams['open']>>
    protected _closer?(...args: Parameters<_TParams['close']>): Promise<ReturnType<_TParams['close']>>

    protected _onBeforeOpen?(): void
    protected _onAfterOpen?(): void

    protected _onBeforeClose?(): void
    protected _onAfterClose?(): void
}

