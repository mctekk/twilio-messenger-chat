<template>
  <div
        class="message-list__item"
        :class="{ 'message-sender': isSender }"
    >
    <span
        v-if="showSender"
        class="sender-name"
        :class="{ me: isSender }"
    >
    {{ message.author }}:</span
    >
    <div>
    <div v-html="message.state.body" class="message-body"></div>
    <small class="meta-data">
        {{ stringDate }}
        <div v-if="isSender" class="inline">
        <i class="fa fa-check"></i>
        <i class="fa fa-check" v-if="isRead"> </i>
        </div>
    </small>
    </div>
</div>
</template>

<script>
import { format } from "date-fns";
export default {
    props: {
        showSender: {
            type: Boolean,
            default: false,
        },
        isSender: {
            type: Boolean,
            default: false
        },
        isRead: {
            type: Boolean,
            default: false
        },
        message: {
            type: Object,
            required: true
        }
    },
    computed: {
        stringDate() {
            return format(this.message.state.timestamp, 'MMM dd yyyy hh:mm a')
        }
    }

}
</script>

<style lang="scss">
.message-list__item {
    .sender-name {
        display: block;
        margin-bottom: 0.25rem;
    }

    .meta-data {
        text-align: right;
        width: 100%;
        display: block;
        margin-top: 1rem;
        opacity: .8;
    }

}
</style>
