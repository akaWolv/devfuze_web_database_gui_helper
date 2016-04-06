import _ from 'underscore';
import AddBox from 'material-ui/lib/svg-icons/content/add-box';
import Colors from 'material-ui/lib/styles/colors';
import ContentAdd from 'material-ui/lib/svg-icons/content/add';
import FloatingActionButton from 'material-ui/lib/floating-action-button';
import IconButton from 'material-ui/lib/icon-button';
import Paper from 'material-ui/lib/paper';
import RaisedButton from 'material-ui/lib/raised-button';
import React from 'react';
import ReactDOM from 'react-dom';
import Slider from 'material-ui/lib/slider';
import Snackbar from 'material-ui/lib/snackbar';
import TextField from 'material-ui/lib/text-field';

const styles = {
    main_div: {
        height: 'auto',
        width: '90%',
        marginTop: 5,
        marginBottom: 5
    },
    paper: {
        height: 'auto',
        width: '100%',
        textAlign: 'left',
        paddingTop: 25,
        paddingBottom: 75
    },
    button: {
        float: 'right',
        margin: 5
    },
    div_text_field_wrapper: {
        width: '90%',
        marginLeft: '5%',
        marginTop: 5,
        marginBottom: 5
    }
};
const texts = {
    FIELD_TYPES : {
        text: 'Text',
        csv: 'CSV (\' \', \' \')'
    }
}
const CollectionExplorerAddNewElement = React.createClass({
    propTypes: {
        appendDocument: React.PropTypes.func.isRequired,
        collection_fields: React.PropTypes.object.isRequired,
        initially_visible_form: React.PropTypes.bool,
        saveNewRecord: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        var initial = {
            snackbar_visible: false,
            snackbar_text: 'terefere kuku',
            add_new_row_form_visible: undefined == this.props.initially_visible_form ? this.props.initially_visible_form : false,
            document_values: {}
        };
        for (var k in initial.fields) {
            initial.document_values[k] = undefined;
        }
        return initial;
    },
    toggleFormIsVisible: function () {
        this.setState({add_new_row_form_visible: !this.state.add_new_row_form_visible});
        this.scrollBottomAfterRender();
    },
    toggleSnackbarOpen: function () {
        this.setState({snackbar_visible: !this.state.snackbar_visible});
    },
    scrollBottomAfterRender() {
        setTimeout(function () {
            window.scrollTo(0, document.body.scrollHeight);
        }, 0);
    },
    getPaperStyle: function () {
        let fields = _.toArray(this.props.collection_fields)
        var styleToReturn = _.clone(styles.paper);
        styleToReturn.display = this.state.add_new_row_form_visible ? 'block' : 'none';
        styleToReturn.height = styleToReturn.height + (fields.length - 1) * 50;
        return styleToReturn;
    },
    onFieldBlur: function (fieldType, fieldName) {
        if ('csv' == fieldType) {
            var stateToSet = this.state.document_values;
            stateToSet[fieldName] = this._parseCsv(stateToSet[fieldName]);
            this.setState({document_values : stateToSet});
        }
    },
    collectFormData: function (fieldType, event) {
        var stateToSet = this.state.document_values;
        stateToSet[event.target.name] = event.target.value;
        this.setState({document_values : stateToSet});
    },
    saveNewRecord: function () {
        this.props.saveNewRecord(
            this.state.document_values,
            function () {
                this.setState({
                    snackbar_visible: true,
                    snackbar_text: 'Saved!'
                });
                this.toggleFormIsVisible();
            }.bind(this),
            function () {
                this.setState({
                    snackbar_visible: true,
                    snackbar_text: 'error'
                });
            }.bind(this)
        );
        this.setState({document_values: {}});
    },
    render: function () {
        if (undefined == this.props.collection_fields) {
            return null;
        }

        let fields = _.toArray(this.props.collection_fields);
        fields = _.filter(fields, function(elem){ return elem.value.length > 0; });
        return (
            <div style={styles.main_div}>
                <FloatingActionButton
                    onClick={this.toggleFormIsVisible}
                    style={styles.button}>
                    <ContentAdd />
                </FloatingActionButton>
                <Paper
                    style={this.getPaperStyle(fields)} zDepth={2}
                    visible={this.state.add_new_row_form_visible}>
                    <div style={styles.div_text_field_wrapper}>
                        <h4>Add new record</h4>
                    </div>
                    <div style={styles.div_text_field_wrapper}>
                        <table style={{width: '100%'}}>
                            <tbody>
                                {
                                    fields.map(function (elem) {
                                        return (
                                            <tr key={elem.key}>
                                                <td style={{width: '20%'}}>
                                                    {undefined != elem.type ? texts.FIELD_TYPES[elem.type] : texts.FIELD_TYPES['text']}
                                                </td>
                                                <td style={{width: '80%'}}>
                                                    <TextField
                                                        floatingLabelText={elem.value}
                                                        name={elem.value}
                                                        type="text"
                                                        onChange={this.collectFormData.bind(this, elem.type)}
                                                        onBlur={this.onFieldBlur.bind(this, elem.type, elem.value)}
                                                        style={{width: '100%'}}
                                                        disabled={'_id' == elem.value ? true : false}
                                                        value={_.unescape(this.state.document_values[elem.value])}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    }.bind(this))
                                }
                            </tbody>
                        </table>
                    </div>
                    <div style={styles.div_text_field_wrapper}>
                        <RaisedButton
                            label="ADD"
                            primary={true}
                            onClick={this.saveNewRecord}
                            style={{margin: 12, float: 'right'}} />
                    </div>
                </Paper>
                <Snackbar
                    open={this.state.snackbar_visible}
                    message={this.state.snackbar_text}
                    autoHideDuration={4000}
                    onRequestClose={this.toggleSnackbarOpen}
                />
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
    }
});

export default CollectionExplorerAddNewElement;