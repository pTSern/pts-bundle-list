import { Component, _decorator, AssetManager, assetManager, Asset } from "cc";
import { pClass } from "db://pts-core/scripts/utils";

const { ccclass } = _decorator
const { editor_property } = pClass

@ccclass("Assets_BundleManager")
export abstract class Asset_Manager<
    _TAll extends Record<string, Record<pFlex.TKey, any>>,
> extends Component {

    abstract keysToPreload: (keyof _TAll)[]
    protected abstract _all: _TAll
    get all() { return this._all }

    @editor_property()
    get isCompleted() {
        if(!this._all) return false
        return Object.keys(this._all).length === this._bundle.size
    }

    protected _bundle: Map<keyof _TAll, AssetManager.Bundle> = new Map();

    get<
        _TKey extends keyof _TAll,
        _TType extends keyof _TAll[_TKey],
        _TAsset extends Asset
    >(bundle: _TKey, type: _TType, asset: keyof _TAll[_TKey][_TType]) {
        type;
        return new Promise<_TAsset>( async (_rs, _rj) => {
            let _bundle = this._bundle.get(bundle);
            if(!_bundle) {
                _bundle = await this.load(bundle);
                if(!_bundle) {
                    _rj(new Error(`[ Assets_BundleManager ].{ get } >> ERROR: Bundle ${bundle.toString()} Does not existed`))
                    return
                }
            }

            _bundle.load<_TAsset>(asset.toString(), (_err, _asset) => {
                _err ? _rj(_err) : _rs(_asset)
            })
        } )
    }

    preload<
        _TKey extends keyof _TAll,
        _TType extends keyof _TAll[_TKey],
    >(bundle: _TKey, type: _TType, assets: (keyof _TAll[_TKey][_TType])[]) {
        type;
        return new Promise<AssetManager.RequestItem[]>( async (_rs, _rj) => {
            let _bundle = this._bundle.get(bundle);

            if(!_bundle) {
                _bundle = await this.load(bundle);
                if(!_bundle) {
                    _rj(new Error(`[ Assets_BundleManager ].{ get } >> ERROR: Bundle ${bundle.toString()} Does not existed`))
                    return
                }
            }

            _bundle.preload(assets.map(String), (_err, _asset) => {
                _err ? _rj(_err) : _rs(_asset)
            })
        } )
    }

    load<_TKey extends keyof _TAll>(bundle: _TKey) {
         return new Promise<AssetManager.Bundle>( (_rs, _rj) => {
            const _path = bundle.toString();

            assetManager.loadBundle(_path, async (_error, _bundle) => {
                if(_error) {
                    console.error("[ Assets_BundleManager ].{ load } >> ERROR: ", _path, _error);
                    _rj(_error)
                    return;
                }

                this._bundle.set(_path, _bundle);
                console.log("[ Assets_BundleManager ].{ load } >> Complete: ", _path, _bundle);
                _rs(_bundle);
            })
        })
    }

    protected onLoad(): void {
        this.keysToPreload.forEach(_ => this.load(_))
    }

}

