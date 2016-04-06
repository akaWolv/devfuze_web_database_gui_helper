import _ from 'underscore';
import ButtonWithIcon from 'material-ui/lib/icon-button';
import CollectionExplorerElement from './CollectionExplorerElement.jsx';
import CollectionExplorerAddNewElement from './CollectionExplorerAddNewElement.jsx';
import CollectionExplorerSearch from './CollectionExplorerSearch.jsx';
import Colors from 'material-ui/lib/styles/colors';
import IconClose from 'material-ui/lib/svg-icons/navigation/close';
import IconExpand from 'material-ui/lib/svg-icons/navigation/expand-more';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Paper from 'material-ui/lib/paper';
import RaisedButton from 'material-ui/lib/raised-button';
import React from 'react';
import SelectField from 'material-ui/lib/select-field';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';

const styles = {
    toolbar: {
        backgroundColor: Colors.grey500
    },
    toolbar_second_line: {
        backgroundColor: Colors.grey400
    },
    paper_toolbar: {
        marginTop: 5,
        width: '90%'
    }
}

const CollectionExplorer = React.createClass({
    propTypes: {
        db_configurations_collection: React.PropTypes.object.isRequired,
        collection_name: React.PropTypes.string.isRequired,
        stateMachineGoTo: React.PropTypes.func.isRequired,
        setNotification: React.PropTypes.func.isRequired,
        workspacedb: React.PropTypes.object.isRequired
    },
    getInitialState: function () {
        return {
            records: new Array(),
            collection_details: {},
            workspace_collection: {},
            details_initially_loaded: false,
            error_loading_details: false,
            records_initially_loaded: false,
            add_new_open: false,
            is_search_result: false,
            current_search_condition: undefined
        };
    },
    componentWillMount: function () {
        let found = this.props.db_configurations_collection.find({collection_name: {$eq: this.props.collection_name}});
        if (!_.isEmpty(found[0])) {
            let firstValue;

            for (let k in found[0].collection_fields) {
                firstValue = found[0].collection_fields[k].value;
                break;
            }

            this.setState({
                collection_details: found[0],
                details_initially_loaded: true,
                card_header_title: firstValue
            });

            this._setCollection(found[0]).load(function (err) {
                if (!err) {
                    this.getRecords();
                }
            }.bind(this));
        } else {
            this.setState({
                error_loading_details: true,
                add_new_open: _.isEmpty(this.state.records)
            });
        }
    },
    _setCollection: function (collectionDetails) {
        let collection = this.props.workspacedb.collection(collectionDetails.collection_name);
        this.setState({workspace_collection: collection});
        return collection;
    },
    getRecords: function (searchCondition) {
        var isSearchresult = true;
        if (undefined == searchCondition) {
            searchCondition = {};
            isSearchresult = false;
        }

        var found = this.state.workspace_collection.find(searchCondition);

        this.setState({
            records: _.toArray(found),
            records_initially_loaded: true,
            is_search_result: isSearchresult,
            current_search_condition: searchCondition
        });
    },
    searchRecords: function (field, value) {
        if (undefined == value) {
            // search cancel
            this.getRecords();
        } else {
            let searchCondition = {};
            if (value.length > 0) {
                searchCondition[field] = new RegExp(value);
            } else {
                searchCondition[field] = '';
            }
            this.getRecords(searchCondition);
        }
    },
    handleQuit: function () {
        this.props.stateMachineGoTo('CollectionList');
    },
    appendDocument: function (newDocument) {
        let records = this.state.records;
        records.push(newDocument);
        this.setState({records: records});
    },
    removeDocumentById: function (id) {
        this.state.workspace_collection.remove({
            _id: {
                "$eq": id
            }
        });

        this.state.workspace_collection.save(function (err) {
            if (!err) {
                this.getRecords();
            }
        }.bind(this));
    },
    handleCardHeaderChange: function (event, index, value) {
        this.setState({card_header_title: value});
    },
    saveNewRecord: function (documentValues, successFunc, failureFunc) {
        var documentValuesToSave = this._parseDocumentBeforeSave(documentValues);

        this.state.workspace_collection.insert(documentValuesToSave);
        this.state.workspace_collection.save(function (err) {
            if (!err) {
                successFunc();
                this.getRecords(this.state.current_search_condition);
            } else {
                failureFunc();
            }
        }.bind(this));
    },
    updateRecord: function (documentId, documentValues, successFunc, failureFunc) {
        var documentValuesToSave = this._parseDocumentBeforeSave(documentValues);

        this.state.workspace_collection.updateById(documentId, documentValuesToSave);
        this.state.workspace_collection.save(function (err) {
            if (!err) {
                successFunc();
                this.getRecords(this.state.current_search_condition);
            } else {
                failureFunc();
            }
        }.bind(this));
    },
    _parseDocumentBeforeSave: function (documentValue) {
        var documentToSave = {};
        for (var k in this.state.collection_details.collection_fields) {
            let field = this.state.collection_details.collection_fields[k];

            if ('_id' == field.value) {
                continue;
            }

            documentToSave[field.value] = undefined != documentValue[field.value] ? documentValue[field.value] : '';
            if ('csv' == field.type) {
                documentToSave[field.value] = documentToSave[field.value].split(',');
                for (var l in documentToSave[field.value]) {
                    let docValue = documentToSave[field.value][l];
                    docValue = docValue.trim()
                    docValue = docValue.slice(1, docValue.length - 1);
                    documentToSave[field.value][l] = docValue;
                }
            }
        }
        return documentToSave;
    },
    render: function () {
        if (undefined == this.state.collection_details) {
            return null;
        }

        var content = '';

        if (true === this.state.error_loading_details) {
            // error occured
            content = <center key="CollectionExplorerError">Wah wah wah... Error loding details</center>;
        } else if (true === this.state.details_initially_loaded && true === this.state.records_initially_loaded) {
            content = <center key="CollectionExplorer">
                <Paper style={styles.paper_toolbar} zDepth={2}>
                    <Toolbar style={styles.toolbar}>

                        <ToolbarGroup float="left">
                            <ToolbarTitle text={'collection: ' + this.state.collection_details.collection_name} />
                            <ToolbarSeparator />
                        </ToolbarGroup>

                        <ToolbarGroup float="left">
                            <span style={{marginLeft: 10, marginRight: 10, lineHeight: '60px'}}>Display: </span>
                        </ToolbarGroup>

                        <ToolbarGroup float="left">
                            <SelectField
                                value={this.state.card_header_title}
                                onChange={this.handleCardHeaderChange}
                                style={{textAlign: 'left', marginTop: '5px'}} >
                                {
                                    _.toArray(this.state.collection_details.collection_fields).map(function (elem) {
                                        return <MenuItem
                                            key={elem.key}
                                            value={elem.value}
                                            primaryText={elem.value}
                                            style={{textAlign: 'left'}} />
                                    })
                                }
                            </SelectField>
                        </ToolbarGroup>

                        <ToolbarGroup float="right" lastChild={true}>
                            <ButtonWithIcon
                                tooltip="Quit"
                                onClick={this.handleQuit}>
                                <IconClose style={{marginLeft: 10, marginTop: 15}} />
                            </ButtonWithIcon>
                            <ToolbarSeparator />
                        </ToolbarGroup>

                    </Toolbar>

                    <Toolbar style={styles.toolbar_second_line}>
                        <CollectionExplorerSearch
                            collection_fields={this.state.collection_details.collection_fields}
                            is_search_result={this.state.is_search_result}
                            searchRecords={this.searchRecords} />
                    </Toolbar>
                </Paper>
                <br />
                {
                    this.state.records.map(function (elem) {
                        console.log(elem);
                        return (
                            <CollectionExplorerElement
                                key={elem._id}
                                collection_fields={this.state.collection_details.collection_fields}
                                document_values={elem}
                                workspace_collection={this.state.workspace_collection}
                                collection_details={this.state.collection_details}
                                removeDocumentById={this.removeDocumentById}
                                setNotification={this.props.setNotification}
                                card_header_title={this.state.card_header_title}
                                updateRecord={this.updateRecord} />
                        );
                    }.bind(this))
                }
                <CollectionExplorerAddNewElement
                    collection_fields={this.state.collection_details.collection_fields}
                    workspace_collection={this.state.workspace_collection}
                    initially_opened_form={this.state.add_new_open}
                    appendDocument={this.appendDocument}
                    setNotification={this.props.setNotification}
                    saveNewRecord={this.saveNewRecord} />
            </center>;
        } else {
            // wait until collection details and records would be loaded
            content = <center key="CollectionExplorerLoading">Loading...</center>;
        }

        return content;
    }
});

export default CollectionExplorer;