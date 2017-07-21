/* eslint-disable import/no-unresolved */
import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { User } from 'meteor/socialize:user-model';
/* eslint-enable import/no-unresolved */

import { Block, BlocksCollection } from './block-model.js';

// Array to store additional blocking check functions
const blockHooks = [];

/**
 * Register a new function that if returns true signifies that a user is blocked
 * @param {Function} hook A function which returns true if the user should be considered blocked
 */
User.registerBlockingHook = function registerBlockingHook(hook) {
    if (_.isFunction(hook)) {
        // add the hook to the blockHooks array
        blockHooks.push(hook);
    }
};

User.methods({
    /**
     * Check if the user blocks another by running checks which
     * have been registered with User.registerBlockingHook()
     * @method blocksUser
     * @param   {Object}  [user=Meteor.user()] The user instance to check. Defaults to
     *                                       Meteor.user()
     * @returns {Boolean} Whether or not the user is blocked
     */
    blocksUser(user = Meteor.user()) {
        const self = this;
        let blocked = false;

        if (!this.isSelf(user) && !this.isFriendsWith(user._id)) {
            _.all(blockHooks, function allHooks(hook) {
                if (hook.call(self, user)) {
                    blocked = true;
                }
            });
        }
        return blocked;
    },

    /**
     * Check if user blocks another by thier _id
     * @param   {Object}  user The User instance to check against
     * @returns {Boolean} Whether the user is blocked or not
     */
    blocksUserById(user) {
        return !!BlocksCollection.findOne({ userId: this._id, blockedUserId: user._id });
    },

    /**
     * Block a user by their _id
     * @method block
     */
    block() {
        new Block({ blockedUserId: this._id }).save();
    },

    /**
     * Unblock a user that was previously blocked by their _id
     * @method unblock
     */
    unblock() {
        // find then remove because you must remove records by _id on client
        const block = BlocksCollection.findOne({ userId: Meteor.userId(), blockedUserId: this._id });

        block && block.remove();
    },

    /**
     * Get a list of userIds who are blocking the user
     * @method blockedByUsers
     */
    blockedByUserIds(limit, skip) {
        const options = { limit, skip };
        return BlocksCollection.find({ blockedUserId: this._id }, options).map(block => block.userId);
    },

    /**
     * Get a cursor of User instances who are blocking the user
     * @param   {Number}       limit The number of records to limit the result set to
     * @param   {Number}       skip  The number of records to skip
     * @returns {Mongo.Cursor} A cursor which when iterated over returns User instances
     */
    blockedByUsers(limit, skip) {
        const ids = this.blockedByUserIds(limit, skip);
        return Meteor.users.find({ _id: { $in: ids } });
    },

    /**
     * Get a list of userIds that the user blocks
     * @method blockedUsers
     */
    blockedUserIds(limit, skip) {
        const options = { limit, skip };
        return BlocksCollection.find({ userId: this._id }, options).map(block => block.blockedUserId);
    },

    /**
     * Get a cursor of User instances that the user is blocking
     * @param   {Number}       limit The number of records to limit the result set to
     * @param   {Number}       skip  The number of records to skip
     * @returns {Mongo.Cursor} A cursor which when iterated over returns User instances
     */
    blockedUsers(limit, skip) {
        const ids = this.blockedUserIds(limit, skip);
        return Meteor.users.find({ _id: { $in: ids } });
    },

});

// Register a hook to check if the user block another by _id field
User.registerBlockingHook(function blocksUserById(user) {
    return this.blocksUserById(user);
});
