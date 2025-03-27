<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced" @keyup.enter="loginPlain(user, password)">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span>{{ $t('login') }}</span></h2>
            <div class="eleven columns offset-by-one">
                <div v-show="allUsersList.length > 0">
                    <div class="srow">
                        <div class="eleven columns">
                            <div class="srow saved-user" v-for="username in allUsersList" style="margin-bottom: 0">
                                <div :class="username === activeUser ? 'loggedIn' : ''">
                                    <div class="four columns" style="margin-bottom: 0.5em">
                                    <span style="margin-right: 0.6em">
                                        <span class="fa-stack" v-if="savedLocalUsers.includes(username)" :title="'LABEL_USER_LOCAL' | translate">
                                            <i class="fas fa-user fa-2x" ></i>
                                        </span>
                                        <span class="fa-stack" v-if="savedOnlineUsers.includes(username)" :title="'LABEL_USER_CLOUD' | translate">
                                            <i class="fas fa-user fa-stack-2x"></i>
                                            <i class="fas fa-cloud fa-1x" style="position: absolute; top: 20px; left: 20px; color: dodgerblue"></i>
                                        </span>
                                        <span class="fa-stack" v-if="!savedOnlineUsers.includes(username) && !savedLocalUsers.includes(username)" :title="'LABEL_USER_ONLINE' | translate">
                                            <i class="fas fa-user fa-stack-2x"></i>
                                            <i class="fas fa-globe fa-1x" style="position: absolute; top: 20px; left: 20px; color: dodgerblue"></i>
                                        </span>
                                    </span>
                                        <strong >{{username}}</strong>
                                        <em v-show="username === activeUser">{{ $t('activeBracket') }}</em>
                                    </div>
                                    <button class="four columns" @click="loginStored(username)" v-show="hasValidMajorModelVersion(username)">
                                        <span>{{ $t('open') }}</span>
                                        <i class="fas fa-sign-in-alt" v-show="loginTryUser !== username"></i>
                                        <i class="fas fa-spinner fa-spin" v-show="loginSuccess == undefined && loginTryUser === username"></i>
                                        <i style="color: red" class="fas fa-times" v-show="loginSuccess == false && loginTryUser === username"/>
                                        <i style="color: green" class="fas fa-check" v-show="loginSuccess == true && loginTryUser === username"/>
                                    </button>
                                    <button class="four columns" @click="removeStoredUser(username)" v-show="hasValidMajorModelVersion(username)">
                                        <span v-show="!savedLocalUsers.includes(username)">
                                            <span>{{ $t('logout') }}</span> <i class="fas fa-user-times"></i>
                                        </span>
                                            <span v-show="savedLocalUsers.includes(username)">
                                            <span>{{ $t('delete') }}</span> <i class="fas fa-trash"></i>
                                        </span>
                                    </button>
                                    <div class="eight columns" v-show="!hasValidMajorModelVersion(username)">
                                        <div>
                                            <i class="fas fa-exclamation-triangle"></i> <span>{{ $t('incompatibleDataModelVersion') }}</span>
                                        </div>
                                        <div>
                                            <i18n path="changeToLatestToOpen" tag="span">
                                                <template v-slot:latestLink>
                                                    <a href="https://grid.asterics.eu/latest/#login">grid.asterics.eu/latest</a>
                                                </template>
                                            </i18n>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="srow">
                        <form autocomplete="on" class="eleven columns saved-user" onsubmit="event.preventDefault()">
                            <div class="srow">
                                <strong>{{ $t('loginWithOtherUser') }}</strong>
                            </div>
                            <div class="srow">
                                <label for="inputUser" class="two columns"><span>{{ $t('username') }}</span></label>
                                <input type="text" name="username" v-model="user" id="inputUser" class="four columns" autocomplete="username"/>
                                <button type="button" v-if="savedUsers.includes(user) && hasValidMajorModelVersion(user)" class="four columns" @click="loginStored(user)">
                                    <span>{{ $t('open') }}</span> <i class="fas fa-sign-in-alt"></i>
                                </button>
                            </div>
                            <div class="srow" v-show="!savedUsers.includes(user)">
                                <label for="inputPassword" class="two columns"><span>{{ $t('password') }}</span></label>
                                <input type="password" v-model="password" id="inputPassword" class="four columns" autocomplete="current-password"/>
                            </div>
                            <div class="srow" v-show="!savedUsers.includes(user)">
                                <div class="four columns offset-by-two" style="margin-bottom: 1.0em">
                                    <input type="checkbox" checked v-model="remember" id="inputRemember"/>
                                    <label for="inputRemember"><span>{{ $t('rememberThisUserAndMakeItAvailableForOfflineUse') }}</span></label>
                                </div>
                                <button type="button" @click="loginPlain(user, password)" :disabled="!user || !password" class="five columns offset-by-one">
                                    <span>{{ $t('login') }}</span>
                                    <span>
                                        <i class="fas fa-spinner fa-spin" v-show="loginSuccess === undefined && loginTryUser === user"/>
                                        <i style="color: red" class="fas fa-times" v-show="loginSuccess == false && loginTryUser === user"/>
                                        <i style="color: green" class="fas fa-check" v-show="loginSuccess == true && loginTryUser === user"/>
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div v-show="allUsersList.length == 0">
                    <form autocomplete="on" onsubmit="event.preventDefault()">
                        <div class="srow">
                            <label for="inputUser2" class="one column"><span class="desktop-right">{{ $t('username') }}</span></label>
                            <input type="text" name="username" v-model="user" id="inputUser2" class="four columns" autocomplete="username"/>
                        </div>
                        <div class="srow">
                            <label for="inputPassword2" class="one column"><span class="desktop-right">{{ $t('password') }}</span></label>
                            <input type="password" v-model="password" id="inputPassword2" class="four columns" autocomplete="current-password"/>
                        </div>
                        <div class="srow">
                            <div class="four columns offset-by-one">
                                <input type="checkbox" checked v-model="remember" id="inputRemember2"/>
                                <label for="inputRemember2"><span>{{ $t('rememberThisUserAndMakeItAvailableForOfflineUse') }}</span></label>
                                <br/>
                                <span class="fa fa-info-circle"/> <span>{{ $t('doNotCheckForAOnetimeLoginOnForeign') }}</span>
                            </div>
                        </div>
                    </form>
                    <div class="srow">
                        <button @click="loginPlain(user, password)" :disabled="!user || !password" class="four columns offset-by-one">{{ $t('login') }}</button>
                    </div>
                    <div class="srow">
                        <div class="four columns offset-by-one">
                            <div v-show="loginSuccess === undefined">
                                <span>{{ $t('loggingIn') }}</span> <i class="fas fa-spinner fa-spin"/>
                            </div>
                            <div v-show="loginSuccess === false">
                                <i style="color: red" class="fas fa-times"/>
                                <span>{{loginErrorCode | translate}}</span>
                            </div>
                            <div v-show="loginSuccess === true">
                                <span>{{ $t('loginSuccessful') }}</span> <i style="color: green" class="fas fa-check"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="srow">
                    <div class="twelve columns">
                        <span v-show="allUsersList.length === 0">{{ $t('noAccount') }}</span>
                        <span v-show="allUsersList.length > 0">{{ $t('addNewAccount') }}</span>
                        <a href="#register">{{ $t('registernow') }}</a>
                        <div v-show="allUsersList.length === 0">
                            <span>{{ $t('astericsGridIsFreeAndAllYouNeedToRegister') }}</span>
                        </div>
                    </div>
                </div>
                <div class="srow">
                    <div class="twelve columns">
                        <span>{{ $t('wantToCreateAnOfflineonlyUser') }}</span>
                        <a href="#add">{{ $t('addOfflineUser') }}</a>
                    </div>
                </div>
            </div>
        </div>
        <div class="bottom-spacer"></div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {loginService} from './../../js/service/loginService.js';
    import {databaseService} from "../../js/service/data/databaseService";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {Router} from "../../js/router";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {modelUtil} from "../../js/util/modelUtil";

    export default {
        components: {HeaderIcon},
        props: [],
        data() {
            return {
                user: null,
                password: null,
                remember: true,
                loginTryUser: null,
                loginSuccess: null,
                loginErrorCode: null,
                savedUsers: [],
                savedOnlineUsers: [],
                savedLocalUsers: [],
                allUsersList: [],
                activeUser: null
            }
        },
        methods: {
            toMain() {
                Router.toMain();
            },
            loginPlain(user, password) {
                let thiz = this;
                if (this.savedUsers.includes(user)) {
                    thiz.loginStored(user);
                    return;
                }
                if (!user || !password) {
                    return;
                }
                thiz.loginTryUser = user;
                thiz.loginSuccess = undefined;
                thiz.loginErrorCode = '';
                loginService.loginPlainPassword(user, password, this.remember).then(() => {
                    thiz.loginSuccess = true;
                    Router.toMain();
                }).catch((reason) => {
                    thiz.loginSuccess = false;
                    thiz.loginErrorCode = reason;
                });
            },
            loginStored(user) {
                let thiz = this;
                if (!user || (!thiz.savedUsers.includes(user) && loginService.getLoggedInUsername() !== user)) {
                    return;
                }
                thiz.loginSuccess = undefined;
                thiz.loginTryUser = user;
                thiz.loginErrorCode = '';
                loginService.loginStoredUser(user).then(() => {
                    thiz.loginSuccess = true;
                }).catch(reason => {
                    thiz.loginSuccess = false;
                    thiz.loginErrorCode = reason;
                });
            },
            removeStoredUser(user) {
                if (!(this.savedOnlineUsers.includes(user) || this.savedLocalUsers.includes(user))) {
                    loginService.logout();
                } else {
                    let messageKey = this.savedOnlineUsers.includes(user) ? 'CONFIRM_REMOVE_USER' : 'CONFIRM_REMOVE_USER_LOCAL';
                    if (!confirm(i18nService.t(messageKey, user))) {
                        return;
                    }
                    localStorageService.removeLocalUser(user);
                    if (loginService.getLoggedInUsername() === user) {
                        loginService.logout();
                    }
                    databaseService.deleteDatabase(user);
                }
                this.allUsersList = localStorageService.getSavedUsers(this.activeUser);
                this.savedUsers = localStorageService.getSavedUsers(this.activeUser);
                this.savedOnlineUsers = localStorageService.getSavedOnlineUsers();
                this.savedLocalUsers = localStorageService.getSavedLocalUsers();
            },
            hasValidMajorModelVersion(user) {
                return localStorageService.getUserMajorModelVersion(user) <= modelUtil.getLatestModelVersion().major;
            }
        },
        mounted() {
            let currentlyLoggedInUser = loginService.getLoggedInUsername();
            this.activeUser = localStorageService.getAutologinUser() || currentlyLoggedInUser;
            this.savedUsers = localStorageService.getSavedUsers(this.activeUser);
            this.allUsersList = localStorageService.getSavedUsers(this.activeUser);
            this.savedOnlineUsers = localStorageService.getSavedOnlineUsers();
            this.savedLocalUsers = localStorageService.getSavedLocalUsers();
            if (currentlyLoggedInUser && !this.allUsersList.includes(currentlyLoggedInUser)) {
                this.allUsersList.unshift(currentlyLoggedInUser);
            }
            this.user = this.allUsersList && this.allUsersList.length > 0 ? null : localStorageService.getLastActiveUser();
            if (this.user) {
                document.getElementById('inputPassword2').focus();
            }
        }
    }
</script>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
    }
    .srow {
        margin-bottom: 1.0em;
    }
    .saved-user {
        outline: 1px solid lightgray;
        padding: 1.0em;
    }
    .loggedIn .fa-user {
        color: black;
    }
    .fa-user {
        color: gray;
    }
    .fa-info-circle {
        color: blue;
        margin-left: 3px;
    }
</style>