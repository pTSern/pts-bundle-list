import { _decorator, AssetManager, Node, CCClass, Enum, JsonAsset, Prefab } from 'cc';
import { Bundle_Manager } from 'db://pts-bundle-list/scripts/bundle/Bundle.Manager';
import { Editor_PleaseOverride } from 'db://pts-core/scripts/editor/Smart/Editor.PleaseOverride';
import { CC_IEnumList } from 'db://pts-core/scripts/interfaces/cc/CC.IEnumable';
import { pEngine } from 'db://pts-core/scripts/utils';

const { ccclass, property } = _decorator;

@ccclass('Smart_Bundle_Creator._Loader')
class _Loader {
    @property({ })
    protected _type: string = ''
    @property({ type: Enum({}) })
    get type() { return this._type }
    set type(value: string) {
        this._type = value;
        this._focus();
    }

    @property({ type: Enum({}) })
    assets: string[] = []

    protected _data: any = null
    focus(_type: any) {
        this._data = _type;
        this._focus();
    }

    protected _focus() {
        if(!this._data) return;

        const _types = CC_IEnumList.generator(this._data, (_, b) => b);
        CCClass.Attr.setClassAttr(this, 'type', 'enumList', _types);

        const _asset = this._data[this._type];
        if(!_asset) return;

        const _assets = CC_IEnumList.generator(_asset, (_, b) => b);
        CCClass.Attr.setClassAttr(this, 'assets', 'enumList', _assets);
    }

}

@ccclass('Smart_Bundle_Creator._Helper')
class _Helper {
    @property({ type: JsonAsset, visible() { return !this.isLazyLoad } })
    onBundleLoaded: JsonAsset = null

    @property({ visible() { return !this.onCalled } })
    isLazyLoad: boolean = false

    @property({ type: Node })
    container: Node = null

    @property({ type: Enum({}) })
    get bundle() { return this._bundle }
    set bundle(x) {
        this._bundle = x;
        this.loaders.forEach(_ => _.focus(this._manager.all[this._bundle]));
    }

    @property({ visible() { return this._bundle }, readonly: true })
    protected _bundle: string = ''

    @property({ type: _Loader })
    loaders: _Loader[] = []

    init(bundle: Bundle_Manager<any>): void {
        this._manager = bundle;
        this.onBundleLoaded && pEngine.Json.event.add(this.onBundleLoaded, { func: this._onBundleLoadedLookUp, binder: this });

        if(this.isLazyLoad) {
            this._load();
        }
    }

    destroy(): void {
        pEngine.Json.event.remove(this.onBundleLoaded, { func: this._onBundleLoadedLookUp, binder: this });
    }

    protected _onBundleLoadedLookUp(...args: any[]): void {
        let _bundle: AssetManager.Bundle = null;
        for(let i = 0; i < args.length; i++) {
            if(args[i] instanceof AssetManager.Bundle) {
                _bundle = args[i];
            }
        }
        this._load();
    }

    protected _load() {
        for(const _loader of this.loaders) {
            if(_loader.type !== 'Prefab') continue;

            for(const _asset of _loader.assets) {
                this._manager.glazy<Prefab>(this._bundle, _loader.type, _asset).then( _ => {
                    pEngine.NodeUtils.create({
                        fab: _,
                        parent: this.container,
                    })
                } )
            }
        }
    }

    protected _manager: Bundle_Manager<any> = null;
    focus(bundle: Bundle_Manager<any>) {
        if(!bundle) return;
        this._manager = bundle;

        const _keys = Object.keys(this._manager.all).map(_ => ({ name: _, value: _ }));

        CCClass.Attr.setClassAttr(this, 'bundle', 'enumList', _keys);
        this.loaders.forEach(_ => _.focus(bundle.all[this._bundle]));
    }
}

@ccclass('Smart_Bundle_Creator')
export abstract class Smart_Bundle_Creator extends Editor_PleaseOverride {
    @property({ type: _Helper })
    protected _bridge: _Helper[] = []
    @property({ type: _Helper })
    get bridge() { return this._bridge }
    set bridge(value: _Helper[]) {
        this._bridge = value;
        this._focus();
    }

    protected abstract _manager: Bundle_Manager<any>;

    protected static _$list: string[] = ['_manager']

    protected _onFocusInEditor(): void {
        this._focus()
    }

    protected _onResetInEditor(): void {
        this._focus()
    }

    protected _focus() {
        this.bridge.forEach(_ => _.focus(this._manager));
    }

    protected onLoad(): void {
        this._bridge.forEach(_ => _.init(this._manager));
    }

    protected onDestroy(): void {
        this._bridge.forEach(_ => _.destroy());
    }
}
