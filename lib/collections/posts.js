Posts = new Mongo.Collection('posts');

Posts.allow({
	update: function(userId, post) { return ownsDocument(userId, post); },
	remove: function(userId, post) { return ownsDocument(userId, post); }	
});

Posts.deny({
	update: function(userId, post, fieldName) {
		// may only edit the following two fields:
		return (_.without(fieldName, 'url', 'title').length > 0);
	}
});

Meteor.methods({
	postInsert: function(postAttributes) {
		check(Meteor.userId(), String);
		check(postAttributes, {
			title: String,
			url: String
		});

		var postWithSameLink = Posts.findOne({url: postAttributes.url});
		if (postWithSameLink) {
			return {
				postExists: true,
				_id: postWithSameLink._id
			}
		}

		var user = Meteor.user();
		var post = _.extend(postAttributes, {
			userId: user._id,
			author: user.username,
			submitted: new Date()
		});

		var postId = Posts.insert(post);

		return {
			_id: postId
		}
	},
	postUpdate: function(postId, postProperties) {
		check(postId, String);		
		check(postProperties, {
			title: String,
			url: String
		});

		var postWithSameLink = Posts.findOne({url: postProperties.url, _id: {$ne: postId}});
		if (postWithSameLink) {
			return {
				postExists: true,
				_id: postId
			}
		}

		Posts.update(postId, {$set: postProperties});
		return {
			_id: postId
		};
	}
});