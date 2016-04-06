import _ from 'underscore';
import AddBox from 'material-ui/lib/svg-icons/content/add-box';
import Colors from 'material-ui/lib/styles/colors';
import ContentAdd from 'material-ui/lib/svg-icons/content/add';
import IconButton from 'material-ui/lib/icon-button';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import Paper from 'material-ui/lib/paper';
import RaisedButton from 'material-ui/lib/raised-button';
import React from 'react';
import ReactDOM from 'react-dom';
import Slider from 'material-ui/lib/slider';
import Snackbar from 'material-ui/lib/snackbar';
import TextField from 'material-ui/lib/text-field';

const styles = {
    button: {
        margin: 12,
        float: 'right'
    },
    div_text_field_wrapper: {
        width: '90%',
        marginLeft: '5%',
        marginTop: 5,
        marginBottom: 5
    }
};

const CollectionExplorerElementEdit = React.createClass({
    propTypes: {
        collection_fields: React.PropTypes.object.isRequired,
        document_values: React.PropTypes.object.isRequired,
        expandCard: React.PropTypes.func.isRequired,
        workspace_collection: React.PropTypes.object.isRequired,
        updateRecord: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        var initial = {
            snackbar_visible: false,
            snackbar_text: 'terefere kuku',
            document_values: {},
            fields_initialy_parsed: [],
            fields_details_per_key: {}
        };

        for (var k in initial.fields) {
            initial.document_values[k] = undefined;
        }
        return initial;
    },
    componentWillReceiveProps: function (props) {
        let documentValues = _.clone(props.document_values);

        for (let key in documentValues) {
            if ('csv' == this.state.fields_details_per_key[key].type) {
                documentValues[key] = this._initialyParseCsvValue(documentValues[key])
            }
        }

        this.setState({document_values: documentValues});
    },
    componentWillMount: function () {
        let documentValues = _.clone(this.props.document_values),
            fieldsDetailsPerKey = {};

        for (let k in this.props.collection_fields) {
            fieldsDetailsPerKey[this.props.collection_fields[k].value] = this.props.collection_fields[k];
        }

        for (let key in documentValues) {
            if ('csv' == fieldsDetailsPerKey[key].type) {
                documentValues[key] = this._initialyParseCsvValue(documentValues[key])
            }
        }

        this.setState({document_values: documentValues, fields_details_per_key: fieldsDetailsPerKey});
    },

    toggleSnackbarOpen: function () {
        this.setState({snackbar_visible: !this.state.snackbar_visible});
    },
    collectFormData: function (event) {
        var stateToSet = this.state.document_values;
        stateToSet[event.target.name] = event.target.value;
        this.setState({document_values : stateToSet});
    },
    onFieldBlur: function (fieldType, fieldName) {
        if ('csv' == fieldType) {
            var stateToSet = this.state.document_values;
            stateToSet[fieldName] = this._parseCsv(stateToSet[fieldName]);
            this.setState({document_values : stateToSet});
        }
    },
    updateRecord: function () {
        this.props.updateRecord(
            this.state.document_values._id,
            this.state.document_values,
            function () {
                this.setState({
                    snackbar_visible: true,
                    snackbar_text: 'Saved!'
                });
            }.bind(this),
            function () {
                this.setState({
                    snackbar_visible: true,
                    snackbar_text: 'error'
                });
            }.bind(this)
        );
    },
    render: function () {
        return (
            <div style={{display: 'block'}}>
                <div style={styles.div_text_field_wrapper}>
                    <h4>Edit record</h4>
                </div>
                {
                    Object.keys(this.state.document_values).map(function (key) {
                        return (
                            <div
                                key={key}
                                style={styles.div_text_field_wrapper}>
                                <TextField
                                    floatingLabelText={key}
                                    name={key}
                                    type="text"
                                    onChange={this.collectFormData}
                                    onBlur={this.onFieldBlur.bind(this, this.state.fields_details_per_key[key].type, key)}
                                    style={{width: '100%'}}
                                    value={_.unescape(this.state.document_values[key])}
                                    disabled={key.indexOf('_') == 0}
                                />
                            </div>
                        );
                    }.bind(this))
                }
                <div style={styles.div_text_field_wrapper}>
                    <RaisedButton
                        label="save"
                        primary={true}
                        onClick={this.updateRecord}
                        style={styles.button} />
                </div>
                <Snackbar
                    open={this.state.snackbar_visible}
                    message={this.state.snackbar_text}
                    autoHideDuration={4000}
                    onRequestClose={this.toggleSnackbarOpen}
                />
                <div style={{clear: 'both'}}></div>
            </div>
        );
    },
    _parseCsv: function (value) {
        var valuesSplit = value.split(','),
            valuesToSave = valuesSplit.map(function (elem) {

                elem = elem.trim();

                let sliceStart = 0 == elem.indexOf('\'') ? 1 : 0,
                    sliceEnd = elem.length;

                if (elem.length - 2 == elem.lastIndexOf('\\\'')) {
                    sliceEnd = elem.length;
                } else if (elem.length - 1 == elem.lastIndexOf('\'')) {
                    sliceEnd = elem.length - 1;
                }

                elem = elem.slice(sliceStart, sliceEnd);
                //elem = elem.split('\\\'').join('\'').split('\'').join('\\\'');
                elem = _.escape(elem);
                elem = elem.length > 0 ? '\'' + elem + '\'' : elem;
                return elem;
            });

        return valuesToSave.join(', ');
    },
    _initialyParseCsvValue: function (list) {
        var listToReturn = [];
        for (var k in list) {
            listToReturn.push('\'' + list[k] + '\'');
        }
        return listToReturn.join(', ');
    }
});

export default CollectionExplorerElementEdit;