import pkg from '../package.json';

export const template = `
<div class="panel-container">
    <ui-prop>
        <ui-label slot="label" tooltip="The key that storage this config on global variable. Use '.' for chain object.">Global Variable Key</ui-label>
        <ui-input slot="content" class="global-variable-key" show-clear></ui-input>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label">Is Listing Prefabs</ui-label>
        <ui-checkbox slot="content" class="is-listing-prefabs"></ui-checkbox>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label">Is Listing Images</ui-label>
        <ui-checkbox slot="content" class="is-listing-imgs"></ui-checkbox>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label">Is Listing JSON</ui-label>
        <ui-checkbox slot="content" class="is-listing-json"></ui-checkbox>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label">Is Registered To Bridge ?</ui-label>
        <ui-checkbox slot="content" class="is-registered-to-bridge"></ui-checkbox>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label">Plugin Name</ui-label>
        <ui-input slot="content" class="plugin-name" show-clear></ui-input>
    </ui-prop>
    <ui-prop>
        <ui-label slot="label">Plugin Location</ui-label>
        <ui-file slot="content" class="plugin-location" type="directory" protocols="project"></ui-file>
    </ui-prop>
    <ui-button class="save-btn" type="primary" style="margin-top: 10px; align-self: flex-start;">Save</ui-button>
</div>
`;

export const style = `
:host {
    display: block;
    padding: 15px;
    overflow-y: auto;
    height: 100%;
    box-sizing: border-box;
}
.panel-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
ui-prop {
    margin-bottom: 4px;
}
`;

export const $ = {
    globalVariableKey: '.global-variable-key',
    isListingPrefabs: '.is-listing-prefabs',
    isListingImgs: '.is-listing-imgs',
    isListingJson: '.is-listing-json',
    isRegisteredToBridge: '.is-registered-to-bridge',
    pluginName: '.plugin-name',
    pluginLocation: '.plugin-location',
    saveBtn: '.save-btn',
};

let activePanel: any = null;

async function updateUIValues(thisAny: any) {
    const profile = await Editor.Profile.getProject(pkg.name) as any || {};

    if (thisAny.$.globalVariableKey) thisAny.$.globalVariableKey.value = profile.global_variable_key ?? 'pTS.bundle.list';
    if (thisAny.$.isListingPrefabs) thisAny.$.isListingPrefabs.value = profile.is_listing_prefabs ?? true;
    if (thisAny.$.isListingImgs) thisAny.$.isListingImgs.value = profile.is_listing_imgs ?? true;
    if (thisAny.$.isListingJson) thisAny.$.isListingJson.value = profile.is_listing_json ?? true;
    if (thisAny.$.isRegisteredToBridge) thisAny.$.isRegisteredToBridge.value = profile.is_registered_to_bridge ?? true;
    if (thisAny.$.pluginName) thisAny.$.pluginName.value = profile.plugin_name ?? '_bundle_list';
    if (thisAny.$.pluginLocation) thisAny.$.pluginLocation.value = profile.plugin_location ?? 'assets/__plugins__';
}

const onWindowFocus = () => {
    if (activePanel) {
        updateUIValues(activePanel);
    }
};

export const ready = async function(this: any) {
    activePanel = this;

    // Load initial values
    await updateUIValues(this);

    // Sync on window focus in case setting changes in the settings panel
    window.addEventListener('focus', onWindowFocus);

    const save = async (key: string, value: any, messageName?: string) => {
        await Editor.Profile.setProject(pkg.name, key, value);
        if (messageName) {
            await Editor.Message.send(pkg.name, messageName, key, value);
        }
    };

    this.$.globalVariableKey?.addEventListener('confirm', () => {
        save('global_variable_key', this.$.globalVariableKey.value, 'profile::project::changed');
    });

    this.$.isListingPrefabs?.addEventListener('change', () => {
        save('is_listing_prefabs', this.$.isListingPrefabs.value, 'profile::project::changed_listing');
    });

    this.$.isListingImgs?.addEventListener('change', () => {
        save('is_listing_imgs', this.$.isListingImgs.value, 'profile::project::changed_listing');
    });

    this.$.isListingJson?.addEventListener('change', () => {
        save('is_listing_json', this.$.isListingJson.value, 'profile::project::changed_listing');
    });

    this.$.isRegisteredToBridge?.addEventListener('change', () => {
        save('is_registered_to_bridge', this.$.isRegisteredToBridge.value, 'profile::project::changed');
    });

    this.$.pluginName?.addEventListener('confirm', () => {
        save('plugin_name', this.$.pluginName.value, 'profile::project::changed_location');
    });

    this.$.pluginLocation?.addEventListener('confirm', () => {
        save('plugin_location', this.$.pluginLocation.value, 'profile::project::changed_location');
    });

    this.$.saveBtn?.addEventListener('click', () => {
        Editor.Message.send(pkg.name, 'force-generate');
    });
};

export const close = function(this: any) {
    window.removeEventListener('focus', onWindowFocus);
    activePanel = null;
};
