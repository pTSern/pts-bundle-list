declare namespace pTS {
	export namespace bundle {
		export namespace list {
			enum Enum_game_Prefab {
				"daily_reward/prefabs/DailyReward_Btn" = "daily_reward/prefabs/DailyReward_Btn",
				"daily_reward/prefabs/DailyReward_Popup" = "daily_reward/prefabs/DailyReward_Popup",
				"daily_reward/prefabs/RewardItem_UI" = "daily_reward/prefabs/RewardItem_UI",
				"profile/prefabs/Profile_Popup" = "profile/prefabs/Profile_Popup",
				"$shared/area/prefabs/AreaItem_UI" = "$shared/area/prefabs/AreaItem_UI",
				"$shared/area/prefabs/ArenaItem_Config" = "$shared/area/prefabs/ArenaItem_Config",
				"$shared/avatar/prefabs/avatar" = "$shared/avatar/prefabs/avatar",
				"$shared/avatar/prefabs/Avatar_UI" = "$shared/avatar/prefabs/Avatar_UI",
				"$shared/avatar/prefabs/frame" = "$shared/avatar/prefabs/frame",
				"$shared/builder/prefabs/Builder_Btn" = "$shared/builder/prefabs/Builder_Btn",
				"$shared/coin/prefabs/Coin_UI" = "$shared/coin/prefabs/Coin_UI",
				"$shared/diamond_hunt_process/prefabs/$_data" = "$shared/diamond_hunt_process/prefabs/$_data",
				"$shared/diamond_hunt_process/prefabs/DiamondHuntProcess_UI" = "$shared/diamond_hunt_process/prefabs/DiamondHuntProcess_UI",
				"$shared/heart/prefabs/Heart_UI" = "$shared/heart/prefabs/Heart_UI",
				"$shared/settings/prefabs/Setting_UI" = "$shared/settings/prefabs/Setting_UI",
				"$shared/star/prefabs/Star_UI" = "$shared/star/prefabs/Star_UI",
				"$shared/start_game/prefabs/StartGame_UI" = "$shared/start_game/prefabs/StartGame_UI",
				"decorator/$builder/prefabs/$_data" = "decorator/$builder/prefabs/$_data",
				"decorator/$builder/prefabs/Decorator_Builder_UI" = "decorator/$builder/prefabs/Decorator_Builder_UI",
				"decorator/$level/prefabs/item_ui" = "decorator/$level/prefabs/item_ui",
				"decorator/level_1/prefab/$_config_level_1" = "decorator/level_1/prefab/$_config_level_1",
				"decorator/level_1/prefab/Level_UI_1" = "decorator/level_1/prefab/Level_UI_1",
				"decorator/level_2/prefab/$_config_level_2" = "decorator/level_2/prefab/$_config_level_2",
				"decorator/level_2/prefab/Level_UI_2" = "decorator/level_2/prefab/Level_UI_2",
				"home_screen/$areas_page/prefabs/HomeScreen_Page_Areas" = "home_screen/$areas_page/prefabs/HomeScreen_Page_Areas",
				"home_screen/$main_page/prefabs/HomeScreen_Page_Home" = "home_screen/$main_page/prefabs/HomeScreen_Page_Home",
				"home_screen/_$shared/prefabs/HomeScreen_NavBar" = "home_screen/_$shared/prefabs/HomeScreen_NavBar",
				"home_screen/_$shared/prefabs/HomeScreen_Popup" = "home_screen/_$shared/prefabs/HomeScreen_Popup",
				"message_notifier/prefabs/message" = "message_notifier/prefabs/message"
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
