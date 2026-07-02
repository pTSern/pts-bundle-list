import { _decorator, Node } from "cc";
import { Event_Driver } from "db://pts-core/scripts/Components/Event/Event.Driver";
import { UI_IBase } from "db://pts-asset/interfaces/Components/UI/UI.IBase";
import { Assets_BundleManager } from "../Asets/Assets.BundleManager";

const { ccclass, property } = _decorator;

@ccclass("UI_Controller")
export class UI_Controller<_TId extends pFlex.TKey> extends Event_Driver<{}> {

    @property({ type: Node })
    screen: Node = null

    @property({ type: Node })
    popup: Node = null

    @property({ type: Node })
    loading: Node = null

    @property({ type: Assets_BundleManager })
    bundle: Assets_BundleManager = null

    protected _loader: Map<_TId, Promise<UI_IBase<_TId, any>>> = new Map();
    protected _pool: Map<_TId, UI_IBase<_TId, any>> = new Map()

    protected onLoad(): void {
        if(!this.bundle) {

            return;
        }
    }

    open<_TWho extends UI_IBase<_TId, any>>(id: _TId, ...params: Parameters<_TWho['open']>) {
        let _ui = this._pool.get(id);

        if(_ui) {

        }

        return _ui;
    }

    close() {

    }

    get(id: _TId) {

    }

    preload(id: pFlex.TArray<_TId>, ...ids: _TId[]) {

    }

}
