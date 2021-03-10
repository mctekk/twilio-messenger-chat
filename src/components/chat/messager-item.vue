<template>
  <div class="message-list__item" :class="{ 'message-sender': isSender }">
    <span v-if="showSender" class="sender-name" :class="{ me: isSender }">
      {{ authorName }}:</span
    >
    <div class="message-list__body" :class="{ 'padding-0': isVehicle }">
      <div
        v-html="renderedMessage"
        :class="[isVehicle ? 'message-list__vehicle' : 'message-list__text']"
      ></div>
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
    },
    members: {
      type: Array,
      required: true
    }
  },
  computed: {
    stringDate() {
      return format(this.message.state.timestamp, "MMM dd yyyy hh:mm a");
    },

    isVehicle() {
      return this.message.state.attributes.type == "dealer-vehicle";
    },

    authorName() {
      if (this.members && this.members.length) {
        const memberUser = this.members.find(
          member => member.identity == this.message.author
        );
        return memberUser &&
          memberUser.userAttributes &&
          memberUser.userAttributes.name
          ? memberUser.userAttributes.name
          : this.message.author;
      } else {
        return this.message.author;
      }
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
            <a href="${
              this.message.state.body
            }" target="_blank" class="vehicle-link">
                <div class="dealer-vehicle">
                    <div class="empty-image">
                        <img src="${
                          attrs.photos.length ? attrs.photos[0].url : ""
                        }" />
                    </div>
                    <div class="message-data">
                        <div>${attrs.year} ${attrs.make} ${attrs.model}</div>
                        <div> $ ${attrs.price} | ${attrs.range || " - "}</div>
                        <div>${attrs.stock_number || ""}   ${attrs.mileage ||
          0} miles </div>
                    </div>
                </div>
            </a>
          `;
      }
      return text;
    }
  }
};
</script>

<style lang="scss">
.message-list__item {
  .message-list__body {
    position: relative;
    background: darken(dodgerblue, 40%) !important;
    color: white;
  }

  .sender-name {
    display: block;
    margin-bottom: 0.25rem;
  }

  &.message-sender {
    .message-list__body {
      background: rgb(60, 154, 248) !important;
      color: white;
    }
  }

  .meta-data {
    text-align: right;
    width: 100%;
    display: flex;
    margin-top: 0.25rem;
    opacity: 0.8;
    justify-content: flex-end;

    .inline {
      margin-left: 10px;
      display: inline-block;
    }
  }

  .message-list__vehicle {
    & + .meta-data {
      position: absolute;
      bottom: 12px;
      right: 20px;
    }
  }

  .vehicle-link {
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
        height: 150px;
        position: relative;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
      }

      .message-data {
        padding-top: 15px;
        padding-left: 15px;
        font-weight: bold;
      }
    }
  }
}
</style>
