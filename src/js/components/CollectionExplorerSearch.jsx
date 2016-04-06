import _ from 'underscore';
import ButtonWithIcon from 'material-ui/lib/icon-button';
import IconSearch from 'material-ui/lib/svg-icons/action/search';
import IconCancel from 'material-ui/lib/svg-icons/navigation/cancel';
import MenuItem from 'material-ui/lib/menus/menu-item';
import RaisedButton from 'material-ui/lib/raised-button';
import React from 'react';
import SelectField from 'material-ui/lib/select-field';
import TextField from 'material-ui/lib/text-field';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';

const CollectionExplorerSearch = React.createClass({
    propTypes: {
        collection_fields: React.PropTypes.object.isRequired,
        is_search_result: React.PropTypes.bool.isRequired,
        searchRecords: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        for (var k in this.props.collection_fields) break;

        return {
            field: this.props.collection_fields[k].value,
            value: ''
        };
    },
    handleFieldChange: function (event, index, value) {
        this.setState({field: value})
    },
    handleValueChange: function (event) {
        this.setState({value: _.escape(event.target.value)});
    },
    handleSubmit: function () {
        this.props.searchRecords(
            this.state.field,
            this.state.value
        );
    },
    clearSearch: function () {
        this.setState({value: ''});
        this.props.searchRecords(
            this.state.field
        );
    },
    textFieldHintText: function () {
        if (true === this.props.is_search_result && 0 == this.state.value.length) {
            return 'Searching for empty values';
        } else {
            return 'Search';
        }
    },
    render: function () {
        return (
            <div>
                <ToolbarGroup float="right" lastChild={true}>
                     <ButtonWithIcon
                        tooltip="Cancel search"
                        onClick={this.clearSearch}
                        style={{opacity: (this.props.is_search_result ? 1 : 0)}} >
                        <IconCancel style={{marginTop: 20}} />
                    </ButtonWithIcon>
                </ToolbarGroup>

                <ToolbarGroup float="right">
                    <RaisedButton
                        label="Go"
                        onClick={this.handleSubmit}
                        style={{marginRight: 0}} />
                </ToolbarGroup>

                <ToolbarGroup float="right">
                    <SelectField
                        value={this.state.field}
                        onChange={this.handleFieldChange}
                        style={{marginTop: '5px'}}>
                        {
                            _.toArray(this.props.collection_fields).map(function (elem) {
                                return <MenuItem
                                    key={elem.key}
                                    value={elem.value}
                                    primaryText={elem.value} />
                            })
                        }
                    </SelectField>
                </ToolbarGroup>

                <ToolbarGroup float="right">
                    <span style={{marginLeft: 10, marginRight: 10, lineHeight: '60px'}}>in</span>
                </ToolbarGroup>

                <ToolbarGroup float="right">
                    <TextField
                        hintText={this.textFieldHintText()}
                        style={{marginLeft: 10, marginTop: 5}}
                        onChange={this.handleValueChange}
                        value={_.unescape(this.state.value)} />
                </ToolbarGroup>

                <ToolbarGroup float="right">
                    <span style={{marginLeft: 10, marginRight: 10, lineHeight: '60px'}}>Search for </span>
                </ToolbarGroup>

                <ToolbarGroup float="right">
                    <IconSearch style={{marginLeft: 10, marginTop: 15}} />
                </ToolbarGroup>
            </div>
        );
    }
});

export default CollectionExplorerSearch;
