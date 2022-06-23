<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('importDictionary') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="srow" style="margin-bottom: 3em">
                            <input type="radio" id="radiopredef" name="importType" :value="c.SELECT_ONLINE" v-model="importType">
                            <label for="radiopredef">{{ $t('importFromOnlineDictionaries') }}</label><br/>
                            <input type="radio" id="radiofile" name="importType" :value="c.SELECT_FILE" v-model="importType">
                            <label for="radiofile">{{ $t('importFromFile') }}</label>
                        </div>
                        <div v-show="importType === c.SELECT_ONLINE">
                            <div class="srow">
                                <label class="three columns" for="selectDict">{{ $t('selectDictionary') }}</label>
                                <select id="selectDict" class="nine columns" type="file" v-model="selectedOption">
                                    <option disabled selected hidden :value="null">{{ $t('pleaseSelect') }}</option>
                                    <option v-for="option in options" :value="option">{{option.name | translate}}</option>
                                </select>
                            </div>
                            <div class="srow" v-show="selectedOption && selectedOption.type === c.OPTION_TYPE_GITHUB_FREQUENCYWORDS">
                                <div class="nine columns offset-by-three">
                                    <span>{{ $t('thanksToHermitDaveForSupplyingDataForThis') }} </span>
                                    <a href="https://github.com/hermitdave/FrequencyWords" target="_blank">Github.com</a>
                                </div>
                            </div>
                        </div>
                        <div v-show="importType === c.SELECT_FILE">
                            <div class="srow">
                                <label class="three columns" for="fileInput">{{ $t('selectFile') }}</label>
                                <input id="fileInput" class="nine columns" type="file" accept=".json" @change="onFileSelect"/>
                            </div>
                        </div>
                        <div v-show="!!error" class="srow" style="color: darkred; margin-top: 2.5em">
                            <i class="fas fa-exclamation-triangle"/> <span>{{error | translate}}</span>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="six columns" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="six columns" @click="save()" :title="$t('keyboardCtrlEnter')" :disabled="importType === c.SELECT_ONLINE && !selectedOption || importType === c.SELECT_FILE && !selectedFile">
                                <i class="fas fa-check"/> <span>{{ $t('importDictionary') }}</span> <i class="fas fa-spinner fa-spin" v-show="loading"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import Predictionary from 'predictionary';
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {Dictionary} from "../../js/model/Dictionary.js";
    import {modelUtil} from "../../js/util/modelUtil.js";

    let c = {};
    c.OPTION_TYPE_PREDEFINED = 'OPTION_TYPE_PREDEFINED'
    c.OPTION_TYPE_GITHUB_FREQUENCYWORDS = 'OPTION_TYPE_GITHUB_FREQUENCYWORDS';
    c.SELECT_FILE = 'SELECT_FILE';
    c.SELECT_ONLINE = 'SELECT_ONLINE';

    let githubFrequencyWordsURL = 'https://api.github.com/repos/klues/FrequencyWords/contents';
    let githubFrequencyWordsURLRaw = 'https://raw.githubusercontent.com/klues/FrequencyWords/master';

    export default {
        props: ['dicts'],
        data: function () {
            return {
                importType: c.SELECT_ONLINE,
                options: [{
                    name: i18nService.t('astericsGridGermanDefault'),
                    downloadUrl: 'https://raw.githubusercontent.com/asterics/AsTeRICS-Grid/master/app/dictionaries/default_de.json',
                    type: c.OPTION_TYPE_PREDEFINED
                }, {
                    name: i18nService.t('astericsGridEnglishDefault'),
                    downloadUrl: 'https://raw.githubusercontent.com/asterics/AsTeRICS-Grid/master/app/dictionaries/default_en.json',
                    type: c.OPTION_TYPE_PREDEFINED
                }],
                selectedOption: null,
                selectedFile: null,
                c: c,
                error: null,
                loading: false
            }
        },
        methods: {
            save() {
                let thiz = this;
                this.error = '';
                this.loading = true;
                let existingNames = this.dicts.map(dict => dict.dictionaryKey);
                if (this.importType === c.SELECT_ONLINE) {
                    let predictionary = Predictionary.instance();
                    let dictData;
                    this.requestDict(this.selectedOption.downloadUrl, this.selectedOption.downloadUrl2).then(data => {
                        if (this.selectedOption.type === c.OPTION_TYPE_GITHUB_FREQUENCYWORDS) {
                            predictionary.parseWords(data, {
                                elementSeparator: '\n',
                                rankIsIndex: true
                            });
                            dictData = predictionary.dictionaryToJSON();
                        } else if (this.selectedOption.type === c.OPTION_TYPE_PREDEFINED) {
                            dictData = data;
                        }
                        saveDictAndClose(dictData);
                    }).catch(e => {
                        this.error = e;
                        this.loading = false;
                    });
                } else if (this.importType === c.SELECT_FILE) {
                    let reader = new FileReader();
                    reader.onload = function(event) {
                        try {
                            let json = JSON.parse(event.target.result);
                            let key = Object.keys(json)[0];
                            if (json[key].f === undefined || json[key].t === undefined) {
                                throw new Error();
                            } else {
                                saveDictAndClose(event.target.result);
                            }
                        } catch (e) {
                            thiz.error = i18nService.t('theSelectedFileDoesNotContainDict');
                            thiz.loading = false;
                        }
                    };
                    reader.readAsText(this.selectedFile);
                }

                function saveDictAndClose(dictData) {
                    let name = thiz.importType === c.SELECT_ONLINE ? thiz.selectedOption.name : thiz.selectedFile.name.replace('dictionary-', '').replace('.json', '');
                    let dict = new Dictionary({
                        dictionaryKey: modelUtil.getNewName(name, existingNames),
                        data: dictData,
                        isDefault: true
                    });
                    return dataService.saveDictionary(dict).then(() => {
                        thiz.$emit('reload', dict);
                        thiz.$emit('close');
                    });
                }
            },
            onFileSelect(event) {
                this.selectedFile = event.target.files[0];
                this.error = '';
            },
            requestDict(url, secondTryUrl) {
                return new Promise((resolve, reject) => {
                    $.ajax({
                        url: url,
                        dataType: 'text',
                        accepts: {
                            text: 'application/vnd.github.v3.raw'
                        }
                    }).then((result) => {
                        return resolve(result);
                    }).fail(() => {
                        if (!secondTryUrl) {
                            return reject(i18nService.t('couldNotDownloadDictCheckInternet'));
                        }
                        log.warn("first try to download dict failed. second try...");
                        this.requestDict(secondTryUrl).then(resolve).catch(reject);
                    });
                });
            }
        },
        mounted() {
            let additionalOptions = JSON.parse('[{"langCode":"af","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/af/af_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/af/af_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ar","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ar/ar_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ar/ar_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"bg","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bg/bg_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bg/bg_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"bn","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bn/bn_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bn/bn_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"br","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/br/br_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/br/br_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"bs","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bs/bs_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/bs/bs_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ca","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ca/ca_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ca/ca_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"cs","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/cs/cs_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/cs/cs_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"da","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/da/da_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/da/da_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"de","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/de/de_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/de/de_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"el","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/el/el_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/el/el_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"en","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/en/en_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/en/en_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"eo","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eo/eo_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eo/eo_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"es","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/es/es_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/es/es_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"et","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/et/et_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/et/et_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"eu","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eu/eu_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/eu/eu_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"fa","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fa/fa_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fa/fa_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"fi","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fi/fi_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fi/fi_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"fr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fr/fr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/fr/fr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"gl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/gl/gl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/gl/gl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"he","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/he/he_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/he/he_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hi","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hi/hi_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hi/hi_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hr/hr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hr/hr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hu","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hu/hu_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hu/hu_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"hy","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hy/hy_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/hy/hy_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"id","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/id/id_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/id/id_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"is","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/is/is_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/is/is_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"it","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/it/it_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/it/it_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ja","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ja/ja_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ja/ja_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ka","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ka/ka_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ka/ka_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"kk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/kk/kk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/kk/kk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ko","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ko/ko_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ko/ko_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"lt","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lt/lt_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lt/lt_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"lv","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lv/lv_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/lv/lv_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"mk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/mk/mk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/mk/mk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ml","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ml/ml_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ml/ml_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ms","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ms/ms_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ms/ms_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"nl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/nl/nl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/nl/nl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"no","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/no/no_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/no/no_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"pl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pl/pl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pl/pl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"pt","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt/pt_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt/pt_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"pt_br","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt_br/pt_br_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/pt_br/pt_br_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ro","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ro/ro_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ro/ro_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ru","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ru/ru_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ru/ru_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"si","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/si/si_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/si/si_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sk/sk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sk/sk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sl/sl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sl/sl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sq","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sq/sq_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sq/sq_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sr/sr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sr/sr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"sv","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sv/sv_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/sv/sv_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"ta","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ta/ta_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/ta/ta_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"te","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/te/te_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/te/te_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"th","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/th/th_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/th/th_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"tl","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tl/tl_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tl/tl_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"tr","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tr/tr_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/tr/tr_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"uk","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/uk/uk_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/uk/uk_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"vi","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/vi/vi_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/vi/vi_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"zh","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh/zh_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh/zh_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"},{"langCode":"zh_tw","downloadUrl":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh_tw/zh_tw_50k.txt","downloadUrl2":"https://raw.githubusercontent.com/klues/FrequencyWords/master/content/2016/zh_tw/zh_tw_full.txt","type":"OPTION_TYPE_GITHUB_FREQUENCYWORDS"}]');
            additionalOptions = additionalOptions.map(o => {
                let lang = i18nService.t(`lang.${o.langCode}`);
                o.name = `${lang} (hermitdave@github.com)`;
                return o;
            })
            additionalOptions.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            this.options = this.options.concat(additionalOptions);
            //printOptionsJSON('/content/2016');
        }
    }

    function printOptionsJSON(basePath) {
        $.get(githubFrequencyWordsURL + basePath).then(result => {
            result = result.filter(e => e.type === "dir");
            let options = result.map(e => {
                return {
                    langCode: e.name,
                    downloadUrl: `${githubFrequencyWordsURLRaw}/${e.path}/${e.name}_50k.txt`,
                    downloadUrl2: `${githubFrequencyWordsURLRaw}/${e.path}/${e.name}_full.txt`,
                    type: c.OPTION_TYPE_GITHUB_FREQUENCYWORDS
                }
            });
            console.log(`Options for ${basePath}:`);
            console.log(JSON.stringify(options));
        });
    }
</script>


<style scoped>
    .srow {
        margin-top: 1em;
    }

    h2 {
        margin-top: 2em;
    }
</style>