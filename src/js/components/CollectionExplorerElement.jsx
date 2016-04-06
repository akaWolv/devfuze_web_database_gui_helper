import _ from 'underscore';
import ArrowLeftIcon from 'material-ui/lib/svg-icons/navigation/arrow-back';
import Card from 'material-ui/lib/card/card';
import CardActions from 'material-ui/lib/card/card-actions';
import CardHeader from 'material-ui/lib/card/card-header';
import CardText from 'material-ui/lib/card/card-text';
import CollectionExplorerElementEdit from './CollectionExplorerElementEdit.jsx';
import Colors from 'material-ui/lib/styles/colors';
import FlatButton from 'material-ui/lib/flat-button';
import IconButton from 'material-ui/lib/icon-button';
import IconVisibility from 'material-ui/lib/svg-icons/action/visibility';
import IconEdit from 'material-ui/lib/svg-icons/image/edit';
import IconDelete from 'material-ui/lib/svg-icons/action/delete';
import Paper from 'material-ui/lib/paper';
import React from 'react';
import RemoveCircleIcon from 'material-ui/lib/svg-icons/content/remove-circle-outline';

const styles = {
    card: {
        textAlign: 'left',
        width: '90%',
        marginBottom: 2
    }
};

const CollectionExplorerElement = React.createClass({
    propTypes: {
        card_header_title: React.PropTypes.string.isRequired,
        collection_fields: React.PropTypes.object.isRequired,
        document_values: React.PropTypes.object.isRequired,
        removeDocumentById: React.PropTypes.func.isRequired,
        setNotification: React.PropTypes.func.isRequired,
        workspace_collection: React.PropTypes.object.isRequired,
        updateRecord: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        return {
            mode: 'preview', // preview, edit, remove,
            expanded: false
        };
    },
    expand: function (status) {
        this.setState({expanded: status});
    },
    handleRemove: function () {
        this.props.removeDocumentById(this.props.document_values._id);
        this.props.setNotification(true, 'Record removed.');
    },
    pickMode: function (mode) {
        this.setState({mode: mode})
    },
    viewPreview: function () {
        return (
            <pre>
                {
                    _.unescape(
                        JSON.stringify(
                            JSON.parse(
                                JSON.stringify(this.props.document_values)
                            ), null, 2
                        )
                    )
                }
            </pre>
        );
    },
    viewEdit: function () {
        return <CollectionExplorerElementEdit
            collection_fields={this.props.collection_details.collection_fields}
            workspace_collection={this.props.workspace_collection}
            document_values={this.props.document_values}
            expandCard={this.expand}
            updateRecord={this.props.updateRecord} />;
    },
    viewRemove: function () {
        return (
            <center>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <FlatButton 
                                    onClick={this.pickMode.bind(this, 'preview')}
                                    icon={<ArrowLeftIcon />}
                                    label="Take me back" />
                            </td>
                            <td>
                                <FlatButton 
                                    onClick={this.handleRemove}
                                    icon={<RemoveCircleIcon />}
                                    label="Remove record" primary={true} 
                                    labelPosition="before" />
                            </td>
                        </tr>
                  </tbody>
                </table>
            </center>
        );
    },
    currentView: function () {
        switch (this.state.mode) {
            case 'preview':
                return this.viewPreview();
            case 'edit':
                return this.viewEdit();
            case 'remove':
                return this.viewRemove();
        }
    },
    cardHeaderTitle: function () {
        let value = '';
        if (
            undefined != this.props.document_values[this.props.card_header_title]
            && this.props.document_values[this.props.card_header_title].length > 0
        ) {
            switch (typeof this.props.document_values[this.props.card_header_title]) {
                case 'object':
                    value = _.values(this.props.document_values[this.props.card_header_title]).join(',');
                    break;
                default:
                    value = this.props.document_values[this.props.card_header_title];
            }
        } else {
            value = '/ no value /';
        }
        return value;
    },
    render: function () {
        return (
            <Card
                style={styles.card}
                initiallyExpanded={this.state.expanded}>
                <CardHeader
                    title={this.cardHeaderTitle()}
                    subtitle={_.unescape(_.values(_.omit(this.props.document_values, this.props.card_header_title)).join(', '))}
                    actAsExpander={true}
                    showExpandableButton={true} />
                <CardText expandable={true} style={{backgroundColor: Colors.grey100}}>
                    { this.currentView() }
                </CardText>
                <CardActions expandable={true}>
                    <FlatButton
                        label="Preview"
                        icon={<IconVisibility />}
                        onClick={this.pickMode.bind(this, 'preview')}
                        style={{color: Colors.indigo600}}
                        disabled={'preview' == this.state.mode} />
                    <FlatButton
                        label="Edit"
                        icon={<IconEdit />}
                        onClick={this.pickMode.bind(this, 'edit')}
                        style={{color: Colors.lightGreen600}}
                        disabled={'edit' == this.state.mode} />
                    <FlatButton
                        label="Remove"
                        icon={<IconDelete />}
                        onClick={this.pickMode.bind(this, 'remove')}
                        style={{color: Colors.red600, float: 'right'}}
                        disabled={'remove' == this.state.mode}  />
                </CardActions>
            </Card>
        )
    }
});

export default CollectionExplorerElement;