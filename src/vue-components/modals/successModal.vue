<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container">
                    <div class="modal-header">
                        <i class="fas fa-check-circle" style="color: green; font-size: 3em; margin-bottom: 0.5em;"></i>
                        <h1>{{header}}</h1>
                    </div>

                    <div class="modal-body">
                        <div class="message-text">{{message}}</div>
                        <ul v-if="items && items.length > 0" class="success-items">
                            <li v-for="item in items" :key="item">{{item}}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';

    export default {
        props: [],
        data: function () {
            return {
                header: '',
                message: '',
                items: [],
                autoCloseDuration: 2000,
                timeoutId: null
            }
        },
        methods: {
            show(options) {
                console.log('Success modal show() called with options:', options);

                // Clear any existing timeout
                if (this.timeoutId) {
                    clearTimeout(this.timeoutId);
                }

                this.header = options.header || 'Success';
                this.message = options.message || '';
                this.items = options.items || [];
                this.autoCloseDuration = options.autoCloseDuration || 2000;

                console.log('Success modal data set:', {
                    header: this.header,
                    message: this.message,
                    items: this.items,
                    autoCloseDuration: this.autoCloseDuration
                });

                if (this.autoCloseDuration > 0) {
                    this.timeoutId = setTimeout(() => {
                        console.log('Success modal auto-closing');
                        this.$emit('close');
                        this.timeoutId = null;
                    }, this.autoCloseDuration);
                }
            }
        },
        mounted() {
        },
        beforeDestroy() {
            if (this.timeoutId) {
                clearTimeout(this.timeoutId);
            }
        }
    }
</script>

<style scoped>
    .modal-header {
        text-align: center;
    }

    .modal-body {
        text-align: center;
        padding: 2em;
    }

    .message-text {
        font-size: 1.2em;
        margin-bottom: 1em;
    }

    .success-items {
        list-style: none;
        padding: 0;
        font-size: 1.1em;
    }

    .success-items li {
        margin: 0.5em 0;
    }
</style>
