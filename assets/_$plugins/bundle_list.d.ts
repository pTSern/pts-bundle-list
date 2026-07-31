declare namespace pTS {
	export namespace bundle {
		export namespace list {
			enum Enum_game_Prefab {
				"profile/prefabs/Profile_Popup" = "profile/prefabs/Profile_Popup",
				"$shared/avatar/prefabs/avatar" = "$shared/avatar/prefabs/avatar",
				"$shared/avatar/prefabs/Avatar_UI" = "$shared/avatar/prefabs/Avatar_UI",
				"$shared/avatar/prefabs/frame" = "$shared/avatar/prefabs/frame",
				"$shared/heart/prefabs/Heart_UI" = "$shared/heart/prefabs/Heart_UI",
				"home_screen/$main_page/prefabs/HomeScreen_Page_Home" = "home_screen/$main_page/prefabs/HomeScreen_Page_Home",
				"home_screen/_$shared/prefabs/home_screen" = "home_screen/_$shared/prefabs/home_screen"
			}
			enum Enum_wonder_match_Prefab {
			}

			export type TContainer = {
				game: {
					Prefab: typeof Enum_game_Prefab;
				}
				wonder_match: {
					Prefab: typeof Enum_wonder_match_Prefab;
				}
			}

			export namespace bundle {
				export const list: ["game", "wonder_match"];
				export type TType = typeof list[number];
				export enum Enum {
					game = "game",
					wonder_match = "wonder_match"
				}
				export const CCEnums: { name: TType; value: TType }[];
			}

			export namespace type {
				export const list: ["Prefab"];
				export type TType = typeof list[number];
				export enum Enum {
					Prefab = "Prefab"
				}
				export const CCEnums: { name: TType; value: TType }[];
			}

			export const container: TContainer;
			function get<_TKey extends bundle.TType, _TType extends type.TType>(key: _TKey, type: _TType): TContainer[_TKey][_TType];
		}
	}
}

declare namespace pTS {
    export namespace bridge {
        export type _TBundles_Definded_By_Extensions = {
            bundles: typeof pTS.bundle.list.bundle.Enum
        }
    }
}
