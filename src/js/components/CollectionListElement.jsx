import _ from 'underscore';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardText from 'material-ui/lib/card/card-text';
import Colors from 'material-ui/lib/styles/colors';
import FlatButton from 'material-ui/lib/flat-button';
import IconArrowLeft from 'material-ui/lib/svg-icons/navigation/arrow-back';
import IconBuild from 'material-ui/lib/svg-icons/action/build';
import IconDelete from 'material-ui/lib/svg-icons/action/delete';
import IconDownload from 'material-ui/lib/svg-icons/file/file-download';
import IconEdit from 'material-ui/lib/svg-icons/image/edit';
import IconList from 'material-ui/lib/svg-icons/editor/format-list-numbered';
import IconRemoveCircle from 'material-ui/lib/svg-icons/content/remove-circle-outline';
import IconStorage from 'material-ui/lib/svg-icons/device/storage';
import React from 'react';

const ElectronRemote = require('electron').remote;
const ElectronDialog = ElectronRemote.require('dialog');
const ElectronFs = ElectronRemote.require('fs');

const styles = {
    card: {
        textAlign: 'left',
        width: '100%',
        marginBottom: 2
    }
}

const CollectionListElement = React.createClass({
    propTypes: {
        collection_details: React.PropTypes.object.isRequired,
        collection_sizes: React.PropTypes.object.isRequired,
        removeCollectionByIdAndName: React.PropTypes.func.isRequired,
        setNotification: React.PropTypes.func.isRequired,
        stateMachineGoTo: React.PropTypes.func.isRequired
    },
    getInitialState () {
        return {
            cardContent: 'preview'
        };
    },
    renderCardContent (collectionDetails) {
        let collectionFields = {};

        for (let k in collectionDetails.collection_fields) {
            collectionFields[collectionDetails.collection_fields[k].key] = collectionDetails.collection_fields[k].value;
        }

        switch (this.state.cardContent) {
            case 'preview':
                return (
                    <div style={{marginLeft: 15}}>
                        <h4>Collection fields:</h4>
                        <pre>
                            {
                                JSON.stringify(
                                    JSON.parse(
                                        JSON.stringify(collectionFields)
                                    ), null, 2
                                )
                            }
                        </pre>
                    </div>
                );

            case 'remove':
                return (
                    <center>
                        <table>
                            <tbody>
                            <tr>
                                <td>
                                    <FlatButton
                                        onClick={this.changCardContent.bind(this, 'preview')}
                                        icon={<IconArrowLeft />}
                                        label="Take me back" />
                                </td>
                                <td>
                                    <FlatButton
                                        onClick={this.handleRemoveCollection}
                                        icon={<IconRemoveCircle />}
                                        label="Remove collection" primary={true}
                                        labelPosition="before" />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </center>
                );
        }
    },
    changCardContent(stage) {
        this.setState({cardContent: stage});
    },
    handleDownload() {
        ElectronDialog.showSaveDialog(
            {
                title: 'Export collection',
                defaultPath: this.props.collection_details.collection_name + '.fdb',
                filters: [,
                    { name: 'ForerunnerDB format', extensions: ['fdb'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            },
            function (fileName) {
                if (undefined == fileName) return;

                let localStorageContent = localStorage['ForerunnerDB/FDB/workspace_db-' + this.props.collection_details.collection_name];
                if (undefined == localStorageContent) {
                //    //localStorageContent.replace(/\\"/g, '"').slice(1, -1);
                //} else {
                    localStorageContent = '';
                }

                ElectronFs.writeFile(
                    fileName,
                    localStorageContent,
                    function(error) {
                        if (error) {
                            this.props.setNotification(true, 'Error: ' + error);
                        }
                        else {
                            this.props.setNotification(true, 'Saved to: ' + fileName);
                        }
                    }.bind(this)
                )
        }.bind(this));
    },
    handleRemoveCollection: function () {
        this.props.removeCollectionByIdAndName(this.props.collection_details._id, this.props.collection_details.collection_name);
        this.props.setNotification(true, 'Collection removed.');
    },
    clickOnCollectionHandler (collectionName) {
        this.props.stateMachineGoTo('CollectionExplorer', {collection_name: collectionName});
    },
    render() {
        let elem = this.props.collection_details;
        return (
            <Card
                key={elem._id}
                style={styles.card}
                initiallyExpanded={this.state.is_expanded}>
                <CardHeader
                    title={elem.collection_name}
                    subtitle={
                        undefined != this.props.collection_sizes[elem.collection_name]
                        ? this.props.collection_sizes[elem.collection_name] + ' elements saved in ' + _.size(elem.collection_fields) + ' fields documents'
                        : 'calculating...'
                    }
                    avatar={<IconStorage />}
                    actAsExpander={true}
                    showExpandableButton={true} />
                <CardText expandable={true} style={{backgroundColor: Colors.grey100}}>
                    { this.renderCardContent(elem) }
                </CardText>
                <CardActions expandable={true}>
                    <FlatButton
                        label="Explore"
                        icon={<IconList />}
                        style={{color: Colors.indigo600}}
                        onClick={this.clickOnCollectionHandler.bind(this, elem.collection_name)} />
                    <FlatButton
                        label="Edit"
                        icon={<IconBuild />}
                        style={{color: Colors.lightGreen600, display: 'none'}}
                        disabled={true} />
                    <FlatButton
                        label="Save to file"
                        icon={<IconDownload />}
                        style={{color: Colors.amber600}}
                        onClick={ this.handleDownload } />
                    <FlatButton
                        label="Remove"
                        icon={<IconDelete />}
                        style={{color: Colors.red600, float: 'right'}}
                        onClick={this.changCardContent.bind(this, 'remove')} />
                </CardActions>
            </Card>
        );
    }
});

export default CollectionListElement;
