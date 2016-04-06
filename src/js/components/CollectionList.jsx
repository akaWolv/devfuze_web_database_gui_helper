import _ from 'underscore';
import React from 'react';

import ActionGrade from 'material-ui/lib/svg-icons/action/grade';
import AddBox from 'material-ui/lib/svg-icons/content/add-box';
import AppBar from 'material-ui/lib/app-bar';
import CollectionListElement from './CollectionListElement.jsx';
import Colors from 'material-ui/lib/styles/colors';
import ContentAdd from 'material-ui/lib/svg-icons/content/add';
import ContentDrafts from 'material-ui/lib/svg-icons/content/drafts';
import Divider from 'material-ui/lib/divider';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import IconButton from 'material-ui/lib/icon-button';
import IconBuild from 'material-ui/lib/svg-icons/action/build';
import IconVisibility from 'material-ui/lib/svg-icons/action/visibility';
import IconUpload from 'material-ui/lib/svg-icons/file/file-upload';
import Paper from 'material-ui/lib/paper';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import RaisedButton from 'material-ui/lib/raised-button';

const styles = {
    paper_toolbar: {
        width: '90%',
        marginBottom: 10,
        marginTop: 5,
    },
    title_toolbar: {
        backgroundColor: Colors.grey500
    },
    container: {
        width: '90%',
        textAlign: 'left',
        marginBottom: 10,
        padding: 15,
        bottom: 0,
        height: 'auto',
    },
    button_import_new_collection: {
        float: 'right',
        marginTop: 35,
        marginRight: 10,
    },
    button_add_new_collection: {
        float: 'right',
        marginTop: 25
    }
};

const CollectionList = React.createClass({
    propTypes: {
        db_configurations_collection: React.PropTypes.object.isRequired,
        stateMachineGoTo: React.PropTypes.func.isRequired,
        setNotification: React.PropTypes.func.isRequired,
        workspacedb: React.PropTypes.object.isRequired
    },
    componentWillMount () {
        this._getCollections()
    },
    getInitialState () {
        return {
            selected_index: 1,
            collections: new Array(),
            collections_sizes: {}
        };
    },
    _getCollections () {
        var found = this.props.db_configurations_collection.find();

        for (var k in found) {
            this._getCollectionRowsNumber(found[k]);
        }

        this.setState({collections: found});
    },
    _getCollectionRowsNumber(collectionDetails) {
        let collection = this.props.workspacedb.collection(collectionDetails.collection_name);
        collection.load(function () {
            let collections_sizes = this.state.collections_sizes;
            collections_sizes[collectionDetails.collection_name] = collection._data.length;

            this.setState({collections_sizes: collections_sizes});
        }.bind(this));
    },
    removeCollectionByIdAndName: function (id, name) {
        this.props.db_configurations_collection.remove({
            $and: [
                {
                    _id: {
                        $eq: id
                    }
                },
                {
                    collection_name: {
                        $eq: name
                    }
                }
            ]
        });

        this.props.db_configurations_collection.save(function (err) {
            if (!err) {
                localStorage.removeItem('ForerunnerDB/FDB/workspace_db-' + name);
                this._getCollections();
            }
        }.bind(this));
    },
    addNewClickHandler () {
        this.props.stateMachineGoTo('CreateNewCollection');
    },
    importNewClickHandler () {
        this.props.stateMachineGoTo('ImportNewCollection');
    },
    renderNoCollectionsView() {
        return (
            <div>
                <RaisedButton
                    icon={<ContentAdd />}
                    label="Create new collection from scratch"
                    primary={true}
                    style={{marginRight: '20px'}}
                    onClick={this.addNewClickHandler}/>
                <RaisedButton
                    icon={<IconUpload />}
                    label="Import collection from *.fdb file"
                    secondary={true}
                    style={{marginLeft: '20px'}}
                    onClick={this.importNewClickHandler}/>
            </div>
        );
    },
    renderCollectionList() {
        return (
            <div style={styles.container}>
                {
                    this.state.collections.map(function (elem) {
                        return <CollectionListElement
                            key={elem._id}
                            collection_details={elem}
                            collection_sizes={this.state.collections_sizes}
                            stateMachineGoTo={this.props.stateMachineGoTo}
                            removeCollectionByIdAndName={this.removeCollectionByIdAndName}
                            setNotification={this.props.setNotification}/>;
                    }.bind(this))
                }
                <FloatingActionButton
                    onClick={this.addNewClickHandler}
                    style={styles.button_add_new_collection}>
                    <ContentAdd />
                </FloatingActionButton>
                <FloatingActionButton
                    onClick={this.importNewClickHandler}
                    style={styles.button_import_new_collection}
                    mini={true}
                    backgroundColor={Colors.blue600}>
                    <IconUpload />
                </FloatingActionButton>
            </div>
        );
    },
    render() {
        return (
            <center key="CollectionList">
                <Paper style={styles.paper_toolbar} zDepth={2}>
                    <Toolbar style={styles.title_toolbar}>
                        <ToolbarGroup float="left">
                            <ToolbarTitle text="Your collections"/>
                        </ToolbarGroup>
                    </Toolbar>
                </Paper>
                <br />
                <br />
                {
                    0 === this.state.collections.length
                        ? this.renderNoCollectionsView()
                        : this.renderCollectionList()
                }
            </center>
        );
    }
});

export default CollectionList;