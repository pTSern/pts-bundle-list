
import { _decorator, AssetManager, assetManager, Asset, js } from "cc";
import { pConst } from "db://pts-core/scripts/utils";

interface _$IPromise {
    rs: pFlex.TFunc<[AssetManager.Bundle], void>
    rj: pFlex.TFunc<[Error], void>
    pm: Promise<AssetManager.Bundle>
}

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
                if(_ret._sealed) return _ret;

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
        if(this._sealed) return;

        this._all = all;
        preload.forEach(_ => this.load(_));
    }

    protected constructor() {  }

    protected _all: _TAll
    get all() { return this._all }

    protected get _sealed() { return !!this._all }
    protected _$promises: Record<pFlex.TKey, _$IPromise> = js.createMap(true);

    get completed() {
        if(!this._sealed) return false;
        return Object.keys(this._all).length === assetManager.bundles.count;
    }

    wait<_TKey extends keyof _TAll>(bundle: _TKey) {
        const _bundle = this.at(bundle);
        if(!!_bundle) {
            this._$resolve(bundle, _bundle);
            return Promise.resolve(_bundle);
        }

        if(this._$promises[bundle]) {
            return this._$promises[bundle].pm;
        }

        const pm = new Promise<AssetManager.Bundle>( (rs, rj) => 
            this._$promises[bundle] = { rs, rj, pm: null }
        )

        this._$promises[bundle].pm = pm;
        return pm;
    }

    at(key: keyof _TAll) {
        return assetManager.bundles.get(String(key))
    }

    glazy<_TAsset>(bundle: string, type: string, asset: string): Promise<_TAsset> {
        return this.get(bundle as any, type as any, asset as any) as Promise<_TAsset>
    }

    get<
        _TKey extends keyof _TAll,
        _TType extends keyof _TAll[_TKey],
        _TAsset extends Asset
    >(bundle: _TKey, type: _TType, asset: keyof _TAll[_TKey][_TType]) {
        if(!this._all) return;
        type;

        return new Promise<_TAsset>( async (_rs, _rj) => {
            let _bundle = this.at(bundle);
            if(!_bundle) {
                _bundle = await this.load(bundle);
                if(!_bundle) {
                    _rj(new Error(`[ Assets_BundleManager ].{ get } >> ERROR: Bundle ${bundle.toString()} Does not existed`))
                    return
                }
            }

            _bundle.load<_TAsset>(asset.toString(), (_err, _asset) => 
                _err ? _rj(_err) : _rs(_asset)
            )
        } )
    }

    preload<
        _TKey extends keyof _TAll,
        _TType extends keyof _TAll[_TKey],
    >(bundle: _TKey, type: _TType, assets: (keyof _TAll[_TKey][_TType])[]) {
        if(!this._all) return;
        type;
        return new Promise<AssetManager.RequestItem[]>( async (_rs, _rj) => {
            let _bundle = this.at(bundle);

            if(!_bundle) {
                _bundle = await this.load(bundle);
                if(!_bundle) {
                    _rj(new Error(`[ Assets_BundleManager ].{ get } >> ERROR: Bundle ${bundle.toString()} Does not existed`))
                    return
                }
            }

            _bundle.preload(assets.map(String), (_err, _asset) => 
                _err ? _rj(_err) : _rs(_asset)
            )
        } )
    }

    protected _$resolve(who: pFlex.TKey, asset: AssetManager.Bundle) {
        const _promise = this._$promises[who];

        if(!!_promise) {
            _promise.rs(asset);
            _promise.rs = _promise.rj = pConst.VOID_FUNC;
            _promise.pm = Promise.resolve(asset);
        }
    }

    protected _$reject(who: pFlex.TKey, error: Error) {
        const _promise = this._$promises[who];

        if(!!_promise) {
            _promise.rj(error);
            _promise.rs = _promise.rj = pConst.VOID_FUNC;
            _promise.pm = Promise.reject(error);
        }
    }

    load<_TKey extends keyof _TAll>(bundle: _TKey) {
        if(!this._all) return;
         return new Promise<AssetManager.Bundle>( (_rs, _rj) => {
            const _path = bundle.toString();

            assetManager.loadBundle(_path, async (_error, _bundle) => {
                if(!!_error) {
                    console.error(`[ Assets_BundleManager ].{ load } >> ERROR: Bundle ${_path} Does not existed`)

                    this._$reject(bundle, _error);
                    _rj(_error);
                    return;
                }

                this._$resolve(bundle, _bundle);
                _rs(_bundle);
            })
        })
    }
}

