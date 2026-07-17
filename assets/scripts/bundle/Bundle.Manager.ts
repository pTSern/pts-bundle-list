
import { _decorator, AssetManager, assetManager, Asset, js } from "cc";

export class Bundle_Manager<
    _TAll extends Record<string, Record<pFlex.TKey, any>>,
> {

    private static _$pool: Record<string, Bundle_Manager<any>> = js.createMap(true);

    static generator<_TAll extends Record<string, Record<pFlex.TKey, any>>>(all: _TAll, preload: (keyof _TAll)[] = [], id?: string) {
        let _ret: Bundle_Manager<_TAll>;
        const _is = typeof id == 'string';

        if(_is) {
            _ret = Bundle_Manager._$pool[id];

            if(!!_ret) {
                if(_ret._isSealed) return _ret;

                _ret._init(all, preload);
                return _ret;
            }
        }

        _ret = new Bundle_Manager();
        _ret._init(all, preload);
        _is && ( Bundle_Manager._$pool[id] = _ret )
        return _ret;
    }

    protected _init(all: _TAll, preload: (keyof _TAll)[]): void {
        if(this._isSealed) return;

        this._all = all;
        preload.forEach(_ => this.load(_));
    }

    protected constructor() {  }

    protected _bundle: Map<keyof _TAll, AssetManager.Bundle> = new Map();
    protected _all: _TAll
    get all() { return this._all }

    protected get _isSealed() { return !!this._all }

    get isCompleted() {
        if(!this._isSealed) return false
        return Object.keys(this._all).length === this._bundle.size
    }

    at(key: keyof _TAll) {
        return this._bundle.get(key)
    }

    get<
        _TKey extends keyof _TAll,
        _TType extends keyof _TAll[_TKey],
        _TAsset extends Asset
    >(bundle: _TKey, type: _TType, asset: keyof _TAll[_TKey][_TType]) {
        if(!this._all) return;
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
        if(!this._all) return;
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
        if(!this._all) return;
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


}

