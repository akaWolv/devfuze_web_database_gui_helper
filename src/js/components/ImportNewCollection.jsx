import _ from 'underscore';
import AddBox from 'material-ui/lib/svg-icons/content/add-box';
import ButtonWithIcon from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';
import ContentAdd from 'material-ui/lib/svg-icons/content/add';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import IconClose from 'material-ui/lib/svg-icons/navigation/close';
import Paper from 'material-ui/lib/paper';
import React from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/lib/raised-button';
import Slider from 'material-ui/lib/slider';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import TextField from 'material-ui/lib/text-field';

const ElectronRemote = require('electron').remote;
const ElectronDialog = ElectronRemote.require('dialog');
const ElectronFs = ElectronRemote.require('fs');

const styles = {
    paper_toolbar: {
        width: '95%',
        marginBottom: 20
    },
    title_toolbar: {
        backgroundColor: Colors.grey500
    },
    main_div: {
        bottom: 0,
        height: 'auto',
        width: '95%',
        marginTop: 5,
        marginBottom: 5
    },
    paper_section: {
        height: 'auto',
        width: '95%',
        textAlign: 'left',
        marginBottom: 10,
        paddingTop: 15,
        paddingBottom: 15
    },
    details_div: {
        marginLeft: '5%',
        width: '95%',
        textAlign: 'left'
    }
};

const texts = {
    collection_field_prefix: 'collection_field_',
    default_index_field_name_value: '_id',
    default_error: 'Import impossible. String is invalid.'
};

const ImportNewCollection = React.createClass({
    propTypes: {
        db_configurations_collection: React.PropTypes.object.isRequired,
        setNotification: React.PropTypes.func.isRequired,
        stateMachineGoTo: React.PropTypes.func.isRequired,
        workspacedb: React.PropTypes.object.isRequired
    },
    getInitialState: function () {
        return {
            add_new_row_form_visible: true,
            collection_fields: {},
            collection_details: {},
            import_box_text: '',
            import_file_name: '',
            parsed: false,
            to_refresh: false,
            number_of_records: 0,
            records: {},
            valid_structure: true,
            valid_name: true,
            error_text: texts.default_error,
            ready_to_import: false
        };
    },
    collectFormData: function (type, event) {
        var stateToSet = {};
        stateToSet[type] = undefined != this.state[type] ? this.state[type] : {};
        stateToSet[type][event.target.name] = event.target.value;
        if ('collection_details' == type) {
            stateToSet.valid_name = true;
        }
        this.setState(stateToSet);
    },
    collectImportBoxData: function (event) {
        this.setState({
            import_box_text: event.target.value,
            to_refresh: true
        });
    },
    _validate: function () {
        var valid = true;

        if (_.isEmpty(this.state.collection_details)) {
            valid = false;
            this.setState({valid_name: false});
        }

        if (_.isEmpty(this.state.collection_fields)) {
            valid = false;
            this.setState({valid_structure: false});
        }

        return valid;
    },
    createCollection: function () {

        if (false === this._validate()) {
            return false;
        }

        this.props.db_configurations_collection.insert({
            collection_name: this.state.collection_details.collection_name,
            collection_fields: this._parseFieldsBeforeSave(this.state.collection_fields)
        }, function () {
            this.props.db_configurations_collection.save();
        }.bind(this));

         //save records
        var collection = this.props.workspacedb.collection(this.state.collection_details.collection_name);
        collection.insert(this.state.records, function () {
            this.props.setNotification(true, 'Saving...');
            collection.save(function () {
                this.props.setNotification(true, 'Saved');
                this.handleQuit();
            }.bind(this));
        }.bind(this));
    },
    _parseFieldsBeforeSave(fieldsList) {
        var fieldsNames = [],
            numericFieldIndex = 0;

        for (let k in fieldsList) {
            fieldsNames.push(fieldsList[k].value);
            let nameSplit = k.split('_'),
                currentNumericFieldIndex = nameSplit[nameSplit.length - 1];

            numericFieldIndex = numericFieldIndex < currentNumericFieldIndex ? currentNumericFieldIndex : numericFieldIndex;
        }

        // add '_id' if not exists
        if (-1 == fieldsNames.indexOf(texts.default_index_field_name_value)) {
            let newKey = texts.collection_field_prefix + (parseInt(numericFieldIndex) + 1);
            fieldsList[newKey] = {
                key: newKey,
                value: texts.default_index_field_name_value
            };
        }

        return fieldsList;
    },
    handleQuit: function () {
        this.props.stateMachineGoTo('CollectionList');
    },
    handleImportFileFocus: function (event) {
        ElectronDialog.showOpenDialog(
            {
                title: 'Import collection',
                filters: [,
                    { name: 'ForerunnerDB format', extensions: ['fdb'] }
                ]
            },
            function (fileNames) {
                if (fileNames === undefined) return;
                var fileName = fileNames[0];
                ElectronFs.readFile(fileName, 'utf-8', function (err, data) {
                    this.setState({
                        import_box_text: data,
                        import_file_name: fileName,
                        to_refresh: true
                    });
                    this.parseStructureFromText()
                }.bind(this));
            }.bind(this)
        );
        event.target.blur();
    },
    parseStructureFromText: function (event) {
        undefined == event || event.preventDefault();

        var data = this.state.import_box_text;
        if (!_.isString(data)) {
            // invalid
            this.setState({valid_structure: false, ready_to_import: false});
            return false;
        }

        var numberOfRecords = 0,
            parseMethods = [
                this._parseFdbVariant1,
                this._parseFdbVariant2
            ],
            parseResult,
            errorText = texts.default_error,
            structureFields = {},
            validStructure = false,
            readyToImport = false;

        for (let k in parseMethods) {
            parseResult = parseMethods[k](data);
            if (true === parseResult.isParsed) {
                break;
            }
        }

        if (true === parseResult.isParsed) {

            var uniqueFields = {},
                analizeCorrect = true;

            for (let l in parseResult.parsedList) {
                for (let key in parseResult.parsedList[l]) {
                    let fieldFound = {
                        field_name: key,
                        type: 'function' == typeof parseResult.parsedList[l][key].join ? 'csv' : 'string'
                    };

                    if (undefined == uniqueFields[key]) {
                        uniqueFields[key] = fieldFound;
                    } else if (uniqueFields[key].type != fieldFound.type) {
                        errorText = 'Data in field: ' + key + ' is inconsistent';
                    }
                }

                numberOfRecords++;
            }

            if (true === analizeCorrect) {
                var fieldsCount = 0;
                for (let m in uniqueFields) {
                    let fieldKey = texts.collection_field_prefix + ++fieldsCount;
                    structureFields[fieldKey] = {
                        key: fieldKey,
                        value: uniqueFields[m].field_name,
                        type: uniqueFields[m].type
                    };
                }

                validStructure = true;
                readyToImport = true;
            }
        }

        this.setState({
            collection_fields: structureFields,
            to_refresh: false,
            valid_structure: validStructure,
            number_of_records: numberOfRecords,
            records: parseResult.parsedList,
            ready_to_import: readyToImport,
            error_text: errorText
        });
    },
    render: function () {
        return (
            <center key="ImportNewCollection">
                <div style={styles.main_div}>
                    <Paper style={styles.paper_toolbar} zDepth={2}>
                        <Toolbar style={styles.title_toolbar}>
                            <ToolbarGroup float="left">
                                <ToolbarTitle text="Import new collection" />
                            </ToolbarGroup>
                            <ToolbarGroup float="right">
                                <ButtonWithIcon
                                    tooltip="Quit"
                                    onClick={this.handleQuit}
                                    style={{float: 'right'}}>
                                    <IconClose style={{marginLeft: 10, marginTop: 15}}/>
                                </ButtonWithIcon>
                            </ToolbarGroup>
                        </Toolbar>
                    </Paper>

                    <Paper style={styles.paper_section}>
                        <TextField
                            name='import_box'
                            hintText="Paste here"
                            floatingLabelText="Copy & paste"
                            multiLine={true}
                            rows={1}
                            rowsMax={15}
                            style={{width: '90%', marginLeft: '5%'}}
                            onChange={this.collectImportBoxData}
                            value={this.state.import_box_text}
                            errorText={true === this.state.valid_structure ? '' : this.state.error_text}
                            />

                        <h2 style={{paddingTop: 30, paddingBottom: 30}}>
                            <div style={{width: '42%', border: 0, borderTop: 'solid 1px #eee', float: 'left', marginTop: 15, marginLeft: '5%'}}></div>
                            <div style={{float: 'left', color: '#ddd', width: '5%'}}><center>or</center></div>
                            <div style={{width: '42%', border: 0, borderTop: 'solid 1px #eee', float: 'left', marginTop: 15}}></div>
                        </h2>

                        <TextField
                            hintText="Import a file"
                            onClick={this.handleImportFileFocus}
                            style={{width: '90%', marginLeft: '5%'}}
                            value={this.state.import_file_name}
                            />
                    </Paper>

                    <Paper style={styles.paper_section}>
                            <div style={{marginLeft: '5%', width: '90%', display: ((!this.state.to_refresh && this.state.valid_structure && this.state.ready_to_import) ? 'block' : 'none')}}>
                                <h4>Structure:</h4>
                                <pre>
                                    {
                                        JSON.stringify(
                                            JSON.parse(
                                                JSON.stringify(this.state.collection_fields)
                                            ), null, 2
                                        )
                                    }
                                </pre>
                                <h4>Records:</h4>
                                <span>{this.state.number_of_records}</span>
                            </div>
                            <div style={styles.details_div}>
                                <TextField
                                    name="collection_name"
                                    floatingLabelText={"Collection name"}
                                    style={{width: '100%'}}
                                    errorText={this.state.valid_name ? '' : 'Invalid name.'}
                                    onChange={this.collectFormData.bind(this, 'collection_details')} />
                            </div>
                            <div style={styles.details_div}>
                                <RaisedButton
                                    label="Save"
                                    primary={true}
                                    onClick={this.createCollection}
                                    disabled={(this.state.to_refresh || !this.state.valid_structure)} />
                                <span style={{color: '#aaa', marginLeft: 20, display: ((this.state.to_refresh || !this.state.valid_structure) ? 'inline' : 'none')}}>
                                    Structure must be correctly parsed before save. <a href="#" style={{display: (this.state.to_refresh ? 'inline' : 'none')}} onClick={this.parseStructureFromText}>refresh now</a>
                                </span>
                            </div>
                    </Paper>
                </div>
            </center>
        );
    },
    _parseFdbVariant1: function (data) {
        var regex = new RegExp("json::fdb::(\\[.+\\])"), // full ForerunnerDB db string
            matches = data.match(regex),
            returnedData = {isParsed: false, parsedList: []};

        if (null != matches && matches.length > 0){
            // looks like we have formatted string
            // check if we can parse it
            try {
                var parsedList;
                eval("parsedList = " + matches[1]);
                if ('object' === typeof parsedList) {
                    returnedData = {isParsed: true, parsedList: parsedList};
                }
            } catch (err) {
            }
        }
        return returnedData;
    },
    _parseFdbVariant2: function (data) {
        var regex = new RegExp("\"json::fdb::(\\[.+\\])\""), // full ForerunnerDB db string
            matches = data.match(regex),
            returnedData = {isParsed: false, parsedList: []};

        if (null != matches && matches.length > 0){
            // looks like we have formatted string with escaping in it
            var stringTorParse = matches[1].replace(/\\"/g, '"');;

            // check if we can parse it now
            try {
                var parsedList;
                eval("parsedList = " + stringTorParse);
                if ('object' === typeof parsedList) {
                    returnedData = {isParsed: true, parsedList: parsedList};
                }
            } catch (err) {
                console.debug(matches);
                console.error(err);
            }
        } else {
            console.error('No matches from RegEx in variant 2');
        }
        return returnedData;
    }
});

export default ImportNewCollection;