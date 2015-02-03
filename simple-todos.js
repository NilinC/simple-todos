Tasks = new Mongo.Collection("tasks");

if (Meteor.isClient) {
    // This code only runs on the client
    Template.body.helpers({
        tasks: function () {
            if (Session.get("hideCompleted")) {
                // If hide completed is checked, filter tasks
                return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
            } else {
                // Otherwise, return all of the tasks
                return Tasks.find({}, {sort: {createdAt: -1}});
            }
        },
        hideCompleted: function () {
            return Session.get("hideCompleted");
        },
        incompleteCount: function () {
            return Tasks.find({checked: {$ne: true}}).count();
        }
    });

    Template.body.events({
        "submit .new-task": function (event) {
            // This function is called when the new task form is submitted
            var text = event.target.text.value;

            Meteor.call("addTask", text);

            // Clear form
            event.target.text.value = "";

            // Prevent default form submit
            return false;
        },
        "change .hide-completed input": function (event) {
            Session.set("hideCompleted", event.target.checked);
        }
    });

    Template.task.created = function(){
        // counter starts at 0
        this.state = new ReactiveDict();
        this.state.set('counter', 0);
    };

    Template.task.helpers({
       counter: function(){
           return Template.instance().state.get('counter');
       }
    });

    Template.task.events({
        "click .toggle-checked": function () {
            // Set the checked property to the opposite of its current value
            Meteor.call("setChecked", this._id, ! this.checked);
        },
        "click .delete": function () {
            Meteor.call("deleteTask", this._id);
        },
        "click .counter": function(event, template){
            // increment the counter when button is clicked
            template.state.set('counter', template.state.get('counter') + 1);
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}

Meteor.methods({
    addTask: function (text) {
        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }

        Tasks.insert({
            text: text,
            createdAt: new Date(),
            owner: Meteor.userId(),
            username: Meteor.user().username
        });
    },
    deleteTask: function (taskId) {
        Tasks.remove(taskId);
    },
    setChecked: function (taskId, setChecked) {
        Tasks.update(taskId, { $set: { checked: setChecked} });
    }
});
