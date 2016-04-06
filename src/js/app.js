require('../less/main.less');
'use strict';
import injectTapEventPlugin from 'react-tap-event-plugin';

import CollectionList from './components/CollectionList.jsx';
import CollectionExplorer from './components/CollectionExplorer.jsx';
import CreateNewCollection from './components/CreateNewCollection.jsx';
import ForerunnerDB from 'forerunnerdb';
import ImportNewCollection from './components/ImportNewCollection.jsx';
import Snackbar from 'material-ui/lib/snackbar';
import React from 'react';
import ReactDOM from 'react-dom';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const forerunner = new ForerunnerDB();

const workspacedb = forerunner.db('workspace_db');
workspacedb.persist.driver("LocalStorage");

const appdb = forerunner.db('app_db');
appdb.persist.driver("LocalStorage");
const db_configurations_collection = appdb.collection('db_configurations');

injectTapEventPlugin();

var App = React.createClass({
    _app_states: {
        CollectionList: React.createFactory(CollectionList),
        CollectionExplorer: React.createFactory(CollectionExplorer),
        CreateNewCollection: React.createFactory(CreateNewCollection),
        ImportNewCollection: React.createFactory(ImportNewCollection)
    },
    getInitialState: function () {
        return {
            currentState: 'CollectionList',
            currentStateParams: {},
            snackbar_visible: false,
            snackbar_text: '',
            initialized: false
        }
    },
    componentDidMount: function () {
        db_configurations_collection.load(function () {
            this.setState({initialized: true});
        }.bind(this));
        this.refreshConfigurationCollection();
    },
    /**
     * Notification system
     */
    toggleSnackbarOpen: function () {
        this.setNotification(false, '');
    },
    setNotification: function (visible, text) {
        this.setState({
            snackbar_visible: visible,
            snackbar_text: text
        });
    },
    stateMachineGoTo: function (goTo, params) {
        console.log('Try to change state from: \'' + this.state.currentState + '\' to: \'' + goTo + '\'');
        if (undefined != this._app_states[goTo]) {
            this.setState({
                currentState: goTo,
                currentStateParams: undefined != params ? params : {}
            });

            console.log('Success');
        } else {
            console.error('Invalid state');
        }
    },
    refreshConfigurationCollection: function () {
        console.log(localStorage);
    },
    renderApp: function (viewParams) {
        return (
            <div>
                <ReactCSSTransitionGroup
                    className="main-views"
                    transitionName="main-views"
                    transitionAppear={true}
                    transitionAppearTimeout={300}
                    transitionEnterTimeout={300}
                    transitionLeaveTimeout={300} >
                    {
                        this._app_states[this.state.currentState](viewParams)
                    }
                </ReactCSSTransitionGroup>
                <Snackbar
                    open={this.state.snackbar_visible}
                    message={this.state.snackbar_text}
                    autoHideDuration={4000}
                    onRequestClose={this.toggleSnackbarOpen} />
            </div>
        );
    },
    render: function () {
        let viewParams = {
            key: this.state.currentState,
            stateMachineGoTo: this.stateMachineGoTo,
            setNotification: this.setNotification
        };

        for (var k in this.state.currentStateParams) {
            viewParams[k] = this.state.currentStateParams[k];
        }

        viewParams.workspacedb = workspacedb;
        viewParams.db_configurations_collection = db_configurations_collection;

        return this.state.initialized
            ? this.renderApp(viewParams)
            : <center>loading...</center>;
    }
});

ReactDOM.render(
    <App />,
    document.getElementById('container')
);