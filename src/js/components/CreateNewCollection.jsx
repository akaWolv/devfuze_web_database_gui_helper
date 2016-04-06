import _ from 'underscore';
import AddBox from 'material-ui/lib/svg-icons/content/add-box';
import ButtonWithIcon from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';
import ContentAdd from 'material-ui/lib/svg-icons/content/add';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import IconClose from 'material-ui/lib/svg-icons/navigation/close';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Paper from 'material-ui/lib/paper';
import RaisedButton from 'material-ui/lib/raised-button';
import React from 'react';
import ReactDOM from 'react-dom';
import SelectField from 'material-ui/lib/select-field';
import Slider from 'material-ui/lib/slider';
import TextField from 'material-ui/lib/text-field';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';

const styles = {
    paper_toolbar: {
        width: '90%',
        marginBottom: 20
    },
    title_toolbar: {
        backgroundColor: Colors.grey500
    },
    main_div: {
        bottom: 0,
        height: 'auto',
        marginTop: 5,
        marginBottom: 5
    },
    field_paper: {
        height: 'auto',
        width: '90%',
        textAlign: 'left',
        marginBottom: 10,
        paddingTop: 15,
        paddingBottom: 15
    },
    main_table: {
        margin: 15,
        width: '90%'
    },
    details_paper: {
        height: 200,
        width: '90%',
        textAlign: 'left',
        marginBottom: 10,
        paddingTop: 15
    },
    details_div: {
        margin: 15,
        width: '90%',
        textAlign: 'left'
    }
};

const collection_field_prefix = 'collection_field_';
const default_index_field_name_value = '_id';

const CreateNewCollection = React.createClass({
    propTypes: {
        db_configurations_collection: React.PropTypes.object.isRequired,
        setNotification: React.PropTypes.func,
        stateMachineGoTo: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        return {
            add_new_row_form_visible: true,
            number_of_fields: 1,
            collection_fields: {},
            collection_details: {
                collection_name: {
                    name: 'collection_name',
                    valid: true,
                    value: ''
                }
            },
            postfixes: {},
            all_fields_valid: true,
            all_details_valid: true
        };
    },
    componentDidMount: function () {
        this._createFields();
    },
    onSliderChange: function (event, number) {
        this.setState({number_of_fields: number});
        setTimeout(function () {
            this._createFields();
        }.bind(this), 0);
    },
    blurFieldsFormData: function (fieldKey, event) {
        var collectionFields = this.state.collection_fields,
            value = event.target.value,
            newValue;

        // duplicates
        newValue = this._addPostfixToDuplicate(fieldKey, value, collectionFields);

        if (newValue != value) {
            collectionFields[fieldKey].value = newValue;
            this.setState({collection_fields: collectionFields});
            setTimeout(function (fieldKey) {
                this._validateFields(fieldKey);
            }.bind(this, fieldKey), 0);
        }
    },
    collectFieldsFormData: function (fieldKey, valueToChange, event, i, selectedValue) {
        var collectionFields = this.state.collection_fields,
            value = event.target.value;

        switch (valueToChange) {
            case 'value':
                if (value.length > 0) {
                    // clean
                    value = value.replace(new RegExp('[^a-zA-Z0-9_-]', 'g'), '_');
                }
                collectionFields[fieldKey].value = value;
                break;
            case 'type':
                collectionFields[fieldKey].type = selectedValue;
                break;
        }

        this.setState({collection_fields: collectionFields});

        setTimeout(function (fieldKey) {
            this._validateFields(fieldKey);
        }.bind(this, fieldKey), 0);
    },
    collectDetailsFormData: function (event) {
        var collectionFields = this.state.collection_details,
            name = event.target.name,
            value = event.target.value;

        if (value.length > 0) {
            // clean
            value = value.replace(new RegExp('[^a-zA-Z0-9_-]', 'g'), '_');
        }

        collectionFields[name].value = value;
        this.setState({collection_details: collectionFields});

        setTimeout(function (name) {
            this._validateDetails(name);
        }.bind(this, name), 0);
    },
    createCollection: function () {

        if (false === this._validateFields() || false === this._validateDetails()) {
            return false;
        }

        this.props.db_configurations_collection.insert({
            collection_name: this.state.collection_details.collection_name.value,
            collection_fields: this._parseFieldsBeforeSave(this.state.collection_fields)
        }, function () {
            this.props.setNotification(true, 'Saving...');
            this.props.db_configurations_collection.save(function () {
                this.props.setNotification(true, 'Saved');
                this.handleQuit();
            }.bind(this));
        }.bind(this));
    },
    handleQuit: function () {
        this.props.stateMachineGoTo('CollectionList');
    },
    render: function () {
        return (
            <center key="CreateNewCollection" style={{WebkitUserSelect: 'none'}}>
                <div style={styles.main_div}>

                    <Paper style={styles.paper_toolbar} zDepth={2}>
                        <Toolbar style={styles.title_toolbar}>
                            <ToolbarGroup float="left">
                                <ToolbarTitle text="Create new collection"/>
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

                    <Paper style={styles.field_paper}>
                        <center>
                            <table style={styles.main_table}>
                                <thead>
                                <tr>
                                    <td colSpan="3">
                                        <Slider
                                            step={1}
                                            min={1}
                                            max={20}
                                            value={this.state.number_of_fields}
                                            description={"Number of fields: " + this.state.number_of_fields}
                                            onChange={this.onSliderChange}/>
                                    </td>
                                </tr>
                                </thead>
                                <tbody>
                                {
                                    _.toArray(this.state.collection_fields)
                                        .slice(0, this.state.number_of_fields)
                                        .map(function (field, index) {
                                            return (
                                                <tr key={field.key}>
                                                    <td style={{width: '45%'}}>
                                                        <TextField
                                                            name={field.key + '_name'}
                                                            floatingLabelText={"Field " + (index + 1) + " value"}
                                                            onChange={this.collectFieldsFormData.bind(this, field.key, 'value')}
                                                            onBlur={this.blurFieldsFormData.bind(this, field.key)}
                                                            value={field.value}
                                                            errorText={(field.valid || this.state.all_fields_valid) ? '' : 'Please provide unique name between 1-20 characters.'}
                                                            style={{width: '100%'}} />
                                                    </td>
                                                    <td style={{width: '30%'}}>
                                                    </td>
                                                    <td style={{width: '25%'}}>
                                                        <SelectField
                                                            name={field.key + '_type'}
                                                            onChange={this.collectFieldsFormData.bind(this, field.key, 'type')}
                                                            value={field.type}
                                                            errorText={(field.valid || this.state.all_fields_valid) ? '' : ''}
                                                            style={{width: '100%', marginTop: '10px'}} >
                                                            <MenuItem value={'text'} primaryText="Text"/>
                                                            <MenuItem value={'csv'} primaryText="CSV ('','')"/>
                                                        </SelectField>
                                                    </td>
                                                </tr>
                                            );
                                        }.bind(this))
                                }
                                </tbody>
                            </table>
                        </center>
                    </Paper>

                    <Paper style={styles.details_paper}>
                        <center>
                            <div style={styles.details_div}>
                                <TextField
                                    name="collection_name"
                                    floatingLabelText={"Collection name"}
                                    style={{width: '100%'}}
                                    value={this.state.collection_details.collection_name.value}
                                    errorText={this.state.collection_details && this.state.all_details_valid ? '' : 'Cannot save. Collection details are invalid.'}
                                    onChange={this.collectDetailsFormData}/>
                            </div>
                            <div style={styles.details_div}>
                                <RaisedButton
                                    label="Save"
                                    primary={true}
                                    onClick={this.createCollection}/>
                            </div>
                        </center>
                    </Paper>
                </div>
            </center>
        );
    },
    _createFields: function () {
        var collectionFields = this.state.collection_fields;
        _.range(1, this.state.number_of_fields + 1).map(function (fieldNumber) {

            let fieldKey = collection_field_prefix + fieldNumber;

            if (undefined == this.state.collection_fields[fieldKey]) {
                collectionFields[fieldKey] = {
                    key: fieldKey,
                    value: '',
                    type: 'text',
                    valid: true
                };
            }
        }.bind(this));
        this.setState({collection_fields: collectionFields});
    },
    _addPostfixToDuplicate: function (name, value, collectionFields) {
        for (let s in collectionFields) {
            if (name != s && value == collectionFields[s].value && collectionFields[s].value.length > 0) {
                value = this._addPostfixToDuplicate(name, value + '_2', collectionFields);
                break;
            }
        }

        return value;
    },
    _validateFields: function (field) {

        var collectionFields = this.state.collection_fields,
            fieldsToValidate = [],
            test = new RegExp('^[a-zA-Z0-9_-]{1,20}$'),
            valid = true;

        if (undefined == field) {
            for (let key in collectionFields) {
                fieldsToValidate.push(key);
            }
        } else {
            fieldsToValidate.push(field);
        }

        for (let i in fieldsToValidate) {
            collectionFields[fieldsToValidate[i]].valid = test.test(collectionFields[fieldsToValidate[i]].value);
            if (false === collectionFields[fieldsToValidate[i]].valid) {
                valid = false;
            }
        }

        this.setState({collection_fields: collectionFields, all_fields_valid: valid});
        return valid;
    },
    _validateDetails: function (detailName) {
        var collectionDetails = this.state.collection_details,
            fieldsToValidate = [],
            test = new RegExp('^[a-zA-Z0-9_-]{1,20}$'),
            valid = true;

        if (undefined == detailName) {
            for (let key in collectionDetails) {
                fieldsToValidate.push(key);
            }
        } else {
            fieldsToValidate.push(detailName);
        }

        for (let i in fieldsToValidate) {
            collectionDetails[fieldsToValidate[i]].valid = test.test(collectionDetails[fieldsToValidate[i]].value);
            if (false === collectionDetails[fieldsToValidate[i]].valid) {
                valid = false;
            }
        }

        this.setState({collection_details: collectionDetails, all_details_valid: valid});
        return valid;
    },
    _parseFieldsBeforeSave(fieldsList) {
        var fieldsNames = [],
            numericFieldIndex = 0;

        for (let k in fieldsList) {
            fieldsNames.push(fieldsList[k].value);
            delete fieldsList[k].valid;
            let nameSplit = fieldsList[k].key.split('_'),
                currentNumericFieldIndex = nameSplit[nameSplit.length - 1];

            numericFieldIndex = numericFieldIndex < currentNumericFieldIndex ? currentNumericFieldIndex : numericFieldIndex;
        }

        // add '_id' if not exists
        if (-1 == fieldsNames.indexOf(default_index_field_name_value)) {
            let newKey = collection_field_prefix + (parseInt(numericFieldIndex) + 1);
            fieldsList[newKey] = {
                key: newKey,
                value: default_index_field_name_value
            };
        }

        return fieldsList;
    }
});

export default CreateNewCollection;