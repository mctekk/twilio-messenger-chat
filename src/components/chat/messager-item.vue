<template>
  <div class="message-list__item" :class="{ 'message-sender': isSender }">
    <span v-if="showSender" class="sender-name" :class="{ me: isSender }">
      {{ message.author }}:</span
    >
    <div>
      <div v-html="renderedMessage" :class="[isVehicle ? 'message-vehicle':'message-body' ]"></div>
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
      default: false
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
      return format(this.message.state.timestamp, "MMM dd yyyy hh:mm a");
    },

    isVehicle() {
        return this.message.state.attributes.type == 'dealer-vehicle';
    },

    renderedMessage() {
      const urlRest = /((https:|http:|www\.)\S*)/g;
      const text = this.message.state.body.replaceAll(
        urlRest,
        '<a href="$1" target="_blank">$1</a>'
      );
      if (this.isVehicle) {
          const attrs = this.message.state.attributes;
          return `
            <a href="${this.message.state.body}" target="_blank" class="vehicle-link">
                <div class="dealer-vehicle">
                    <div class="empty-image">
                        <img src="${attrs.photos.length ? attrs.photos[0].url : ''}" />
                    </div>
                    <div class="message-data">
                        <div>${attrs.year} ${attrs.make} ${attrs.model}</div>
                        <div> $ ${attrs.price} | ${attrs.range || " - "}</div>
                        <div>${attrs.stock_number || ''}   ${attrs.mileage || 0} miles </div>
                    </div>
                </div>
            </a>
          `
      }
      return text;
    }
  }
};
</script>

<style lang="scss">
.message-list__item {
    background: darken(dodgerblue, 40%) !important;
    color: white;
  .sender-name {
    display: block;
    margin-bottom: 0.25rem;
  }

  &.message-sender {
      background: rgb(60, 154, 248) !important;
  }

  .meta-data {
    text-align: right;
    width: 100%;
    display: block;
    margin-top: 1rem;
    opacity: 0.8;
  }

    .vehicle-link {
        padding-top: 15px;
        display: block;
        text-decoration: none;
        .dealer-vehicle {
            display: flex;
            position: relative;
            border-radius: 10px;
            width: 100%;
            max-width: 500px;
            overflow: hidden;
        .empty-image {
            width: 40%;
            background: #ccc;
            height: 120px;
            position: relative;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                object-position: center;
            }
        }

        .message-data {
            padding-left: 15px;
            font-weight: bold;
        }
    }

    }
}
</style>
