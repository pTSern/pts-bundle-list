import { _decorator, Button, CCClass, Component, director } from 'cc';
import { CC_EnumList, CC_IEnumable, CC_IEnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable';
import { pConst } from 'db://pts-core/scripts/utils';
import { UI_Controller } from '../UI/UI.Controller';
import { Helper_IdSelector } from 'db://pts-core/scripts/helper/Helper.IdSelector';

const { ccclass, property } = _decorator;

@ccclass('Btn_Opener_UI_Selector')
class _UI_Selector<_T_UI_Id extends pFlex.TKey> {
    @property({ type: Helper_IdSelector, visible() { return !this._controller } })
    sid: Helper_IdSelector = new Helper_IdSelector();

    @property({ type: UI_Controller, visible: true })
    protected _controller: UI_Controller<_T_UI_Id, any> = null;

    get() {
        if(this._controller) return this._controller;

        const _id = this.sid.sid;
        let _out = UI_Controller.get(_id);

        if(!!_out) return _out;
        _out = director.getScene().getComponentInChildren(UI_Controller) as UI_Controller<_T_UI_Id, any>;
        return _out;
    }
}

@ccclass('Btn_Opener')
export abstract class Btn_Opener<_T_UI_Id extends pFlex.TKey> extends Button {
    @property({ type: pConst.ENUM })
    ui: _T_UI_Id = "" as _T_UI_Id;

    @property({ type: _UI_Selector })
    controller = new _UI_Selector<_T_UI_Id>();


    protected abstract _list: CC_IEnumList<_T_UI_Id, _T_UI_Id>[]  | CC_IEnumable<_T_UI_Id> | _T_UI_Id[]
    get list() { return CC_EnumList(this._list) }

    __preload(): void {
        if(!this._list) {
            this.destroy();
            return
        }
        super.__preload();
    }

    onFocusInEditor(): void {
        CCClass.Attr.setClassAttr(this, 'ui', 'enumList', this.list || []);
    }

    protected onLoad(): void {
        this._binding('on');
    }

    protected _binding(type: pFlex.Type.TOnOff) {
        this.node[type](Button.EventType.CLICK, this._actClick, this);
    }

    onDestroy(): void {
        this._binding('off');
        super.onDestroy();
    }

    protected _actClick() {
        const _controller = this.controller.get();
        if(!_controller) return;
        _controller.open(this.ui);
    }
}
