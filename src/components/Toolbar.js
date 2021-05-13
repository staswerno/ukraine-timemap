import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions";
import * as selectors from "../selectors";

import { Tabs, TabPanel } from "react-tabs";
import FilterListPanel from "./controls/FilterListPanel";
import CategoriesListPanel from "./controls/CategoriesListPanel";
import BottomActions from "./controls/BottomActions";
import copy from "../common/data/copy.json";
import {
  trimAndEllipse,
  getImmediateFilterParent,
  getFilterSiblings,
  getFilterAncestors,
  addToColoringSet,
  removeFromColoringSet,
} from "../common/utilities.js";
import { DEFAULT_TAB_ICONS } from "../common/constants";

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.onSelectFilter = this.onSelectFilter.bind(this);
    this.state = { _selected: -1 };
  }

  selectTab(selected) {
    const _selected = this.state._selected === selected ? -1 : selected;
    this.setState({ _selected });
  }

  onSelectFilter(key, matchingKeys) {
    const { filters, activeFilters, coloringSet, maxNumOfColors } = this.props;

    const parent = getImmediateFilterParent(key);
    const isTurningOff = activeFilters.includes(key);

    if (!isTurningOff) {
      const updatedColoringSet = addToColoringSet(coloringSet, matchingKeys);
      if (updatedColoringSet.length <= maxNumOfColors) {
        this.props.actions.updateColoringSet(updatedColoringSet);
      }
    } else {
      if (parent && activeFilters.includes(parent)) {
        const siblings = getFilterSiblings(filters, parent, key);
        let siblingsOff = true;
        for (const sibling of siblings) {
          if (activeFilters.includes(sibling)) {
            siblingsOff = false;
            break;
          }
        }

        if (siblingsOff) {
          const grandparentsOn = getFilterAncestors(key).filter((filt) =>
            activeFilters.includes(filt)
          );
          matchingKeys = matchingKeys.concat(grandparentsOn);
        }
      }

      const updatedColoringSet = removeFromColoringSet(
        coloringSet,
        matchingKeys
      );
      this.props.actions.updateColoringSet(updatedColoringSet);
    }
    this.props.methods.onSelectFilter(matchingKeys);
  }

  renderClosePanel() {
    return (
      <div className="panel-header" onClick={() => this.selectTab(-1)}>
        <div className="caret" />
      </div>
    );
  }

  goToNarrative(narrative) {
    this.selectTab(-1); // set all unselected within this component
    this.props.methods.onSelectNarrative(narrative);
  }

  renderToolbarNarrativePanel() {
    return (
      <TabPanel>
        <h2>{copy[this.props.language].toolbar.narrative_panel_title}</h2>
        <p>{copy[this.props.language].toolbar.narrative_summary}</p>
        {this.props.narratives.map((narr) => {
          return (
            <div className="panel-action action">
              <button
                onClick={() => {
                  this.goToNarrative(narr);
                }}
              >
                <p>{narr.id}</p>
                <p>
                  <small>{trimAndEllipse(narr.desc, 120)}</small>
                </p>
              </button>
            </div>
          );
        })}
      </TabPanel>
    );
  }

  renderToolbarCategoriesPanel() {
    const { panels } = this.props.toolbarCopy;
    const panelTitle = panels.categories.label
      ? panels.categories.label
      : copy[this.props.language].toolbar.categories;
    const panelDescription = panels.categories.description
      ? panels.categories.description
      : copy[this.props.language].toolbar.explore_by_category__description;

    if (this.props.features.USE_CATEGORIES) {
      return (
        <TabPanel>
          <CategoriesListPanel
            categories={this.props.categories}
            activeCategories={this.props.activeCategories}
            onCategoryFilter={this.props.methods.onCategoryFilter}
            language={this.props.language}
            title={panelTitle}
            description={panelDescription}
          />
        </TabPanel>
      );
    }
  }

  renderToolbarFilterPanel() {
    return (
      <TabPanel>
        <FilterListPanel
          filters={this.props.filters}
          activeFilters={this.props.activeFilters}
          onSelectFilter={this.onSelectFilter}
          language={this.props.language}
          coloringSet={this.props.coloringSet}
          filterColors={this.props.filterColors}
        />
      </TabPanel>
    );
  }

  renderToolbarTab(_selected, label, iconKey) {
    const isActive = this.state._selected === _selected;
    const classes = isActive ? "toolbar-tab active" : "toolbar-tab";

    return (
      <div
        className={classes}
        onClick={() => {
          this.selectTab(_selected);
        }}
      >
        <i className="material-icons">{iconKey}</i>
        <div className="tab-caption">{label}</div>
      </div>
    );
  }

  renderToolbarPanels() {
    const { features, narratives } = this.props;
    const classes =
      this.state._selected >= 0 ? "toolbar-panels" : "toolbar-panels folded";
    return (
      <div className={classes}>
        {this.renderClosePanel()}
        <Tabs selectedIndex={this.state._selected}>
          {narratives && narratives.length !== 0
            ? this.renderToolbarNarrativePanel()
            : null}
          {features.USE_CATEGORIES ? this.renderToolbarCategoriesPanel() : null}
          {features.USE_ASSOCIATIONS ? this.renderToolbarFilterPanel() : null}
        </Tabs>
      </div>
    );
  }

  renderToolbarNavs() {
    if (this.props.narratives) {
      return this.props.narratives.map((nar, idx) => {
        const isActive = idx === this.state._selected;

        const classes = isActive ? "toolbar-tab active" : "toolbar-tab";

        return (
          <div
            className={classes}
            onClick={() => {
              this.selectTab(idx);
            }}
          >
            <div className="tab-caption">{nar.label}</div>
          </div>
        );
      });
    }
    return null;
  }

  renderToolbarTabs() {
    const { features, narratives, toolbarCopy } = this.props;
    const narrativesExist = narratives && narratives.length !== 0;
    let title = copy[this.props.language].toolbar.title;
    if (process.env.display_title) title = process.env.display_title;

    const { panels } = toolbarCopy;
    const narrativesLabel = copy[this.props.language].toolbar.narratives_label;
    const filtersLabel = panels.filters.label
      ? panels.filters.label
      : copy[this.props.language].toolbar.filters_label;
    const categoriesLabel = panels.categories.label
      ? panels.categories.label
      : copy[this.props.language].toolbar.categories_label;

    const filterIcon = panels.filters.icon
      ? panels.filters.icon
      : DEFAULT_TAB_ICONS.FILTER;
    const categoriesIcon = panels.categories.icon
      ? panels.categories.icon
      : DEFAULT_TAB_ICONS.CATEGORY;

    const narrativesIdx = 0;
    const categoriesIdx = narrativesExist ? 1 : 0;
    const filtersIdx =
      narrativesExist && features.CATEGORIES_AS_FILTERS
        ? 2
        : narrativesExist || features.CATEGORIES_AS_FILTERS
        ? 1
        : 0;
    return (
      <div className="toolbar">
        <div className="toolbar-header" onClick={this.props.methods.onTitle}>
          <p>{title}</p>
        </div>
        <div className="toolbar-tabs">
          {narrativesExist
            ? this.renderToolbarTab(narrativesIdx, narrativesLabel, "timeline")
            : null}
          {features.CATEGORIES_AS_FILTERS
            ? this.renderToolbarTab(
                categoriesIdx,
                categoriesLabel,
                categoriesIcon
              )
            : null}
          {features.USE_ASSOCIATIONS
            ? this.renderToolbarTab(filtersIdx, filtersLabel, filterIcon)
            : null}
        </div>
        <BottomActions
          info={{
            enabled: this.props.infoShowing,
            toggle: this.props.actions.toggleInfoPopup,
          }}
          sites={{
            enabled: this.props.sitesShowing,
            toggle: this.props.actions.toggleSites,
          }}
          cover={{
            toggle: this.props.actions.toggleCover,
          }}
          features={this.props.features}
        />
      </div>
    );
  }

  render() {
    const { isNarrative } = this.props;

    return (
      <div
        id="toolbar-wrapper"
        className={`toolbar-wrapper ${isNarrative ? "narrative-mode" : ""}`}
      >
        {this.renderToolbarTabs()}
        {this.renderToolbarPanels()}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    filters: selectors.getFilters(state),
    categories: selectors.getCategories(state),
    narratives: selectors.selectNarratives(state),
    language: state.app.language,
    toolbarCopy: state.app.toolbar,
    activeFilters: selectors.getActiveFilters(state),
    activeCategories: selectors.getActiveCategories(state),
    viewFilters: state.app.associations.views,
    narrative: state.app.associations.narrative,
    sitesShowing: state.app.flags.isShowingSites,
    infoShowing: state.app.flags.isInfopopup,
    coloringSet: state.app.associations.coloringSet,
    maxNumOfColors: state.ui.coloring.maxNumOfColors,
    filterColors: state.ui.coloring.colors,
    features: selectors.getFeatures(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators(actions, dispatch),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar);
