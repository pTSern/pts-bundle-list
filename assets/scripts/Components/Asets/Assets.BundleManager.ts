import { Component, _decorator, AssetManager, assetManager, CCString, Enum } from "cc";
import { editor_property } from "db://pts-core/scripts/utils/pClass";

const { ccclass, property } = _decorator

@ccclass("Assets_BundleManager")
export class Assets_BundleManager extends Component {
    @property({ type: [CCString] })
    paths: string[] = []

    @editor_property()
    get isCompleted() { return this._bundle.size === this.paths.length }

    protected _bundle: Map<string, AssetManager.Bundle> = new Map();

    load(path: string) {
        assetManager.loadBundle(path, async (_error, _bundle) => {
            if(_error) {
                console.error("ERROR", path, _error)
                return
            }
            _bundle.load
            this._bundle.set(path, _bundle)
            console.log("COMPLETE", path, _bundle)
        })
    }

    loadAll() {
        this.paths.forEach(_ => this.load(_))
    }

    protected onLoad(): void {
        this.loadAll()
    }

    async get(what: string) {
        let _bundle = this._bundle.get(what);

        return _bundle;
    }

}
