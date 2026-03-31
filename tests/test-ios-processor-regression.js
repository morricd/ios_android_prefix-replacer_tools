const assert = require('assert');
const {
  replacePrefixedIdentifiers,
  normalizeDuplicatePrefixes,
  extractPrefixedIdentifiers
} = require('../src/core/ios-processor');

const oldPrefix = 'YNDCYST';
const newPrefix = 'JunZiLan';

const source = `
/// 头部金额信息
lazy var headerView: YNDCYSTShopCartHeaderView = {
    let headerView = YNDCYSTShopCartHeaderView(frame: .zero)
    return headerView
}()

sortData { (response, error) in
    let jsonDatas = response?.dictionaryBody["data"] as? [[String: Any]]
    var viewModels = [YNDCYSTSortViewModel]()
    for jsonData in (jsonDatas ?? [[:]]) {
        let viewModel = YNDCYSTSortViewModel()
        viewModel.sortModel = jsonData.kj.model(YNDCYSTSortItemModel.self)
        viewModels.append(viewModel)
    }
    weakSortVC?.sortViewModels = viewModels
    weakSortVC?.infoTableView.reloadData()
    weakSortVC?.infoCollectionView.reloadData()
}

static let viewModel = YNDCYSTSortViewModel()

private lazy var filterHeaderView: YNDCYSTSortCommodityHeaderView = {
    let filterHeaderView = YNDCYSTSortCommodityHeaderView(frame: CGRect(origin: .zero, size: CGSize(width: self.view.width, height: 120.0.Scale)))
    filterHeaderView.delegate = self
    return filterHeaderView
}()

lazy var searchView: YNDCYSTSearchView = {
    let searchView = YNDCYSTSearchView(frame: CGRect(x: 0.0, y: 0.0, width: self.view.width, height: 44.0))
    searchView.backgroundColor = .clear
    searchView.searchTextField.delegate = self
    return searchView
}()

getHomeRecommendCommoditys { response, error in
    let jsonArray = response?.dictionaryBody["data"] as? [[String: Any]]
    let models = jsonArray?.kj.modelArray(YNDCYSTCommodityModel.self)
    let viewModel = YNDCYSTCommodityViewModel()
    viewModel.recommendModels = models
}
`;

const replaced = replacePrefixedIdentifiers(source, oldPrefix, newPrefix);

const expectedSnippets = [
  'lazy var headerView: JunZiLanShopCartHeaderView = {',
  'let headerView = JunZiLanShopCartHeaderView(frame: .zero)',
  'var viewModels = [JunZiLanSortViewModel]()',
  'let viewModel = JunZiLanSortViewModel()',
  'jsonData.kj.model(JunZiLanSortItemModel.self)',
  'static let viewModel = JunZiLanSortViewModel()',
  'private lazy var filterHeaderView: JunZiLanSortCommodityHeaderView = {',
  'let filterHeaderView = JunZiLanSortCommodityHeaderView(frame: CGRect(',
  'lazy var searchView: JunZiLanSearchView = {',
  'let searchView = JunZiLanSearchView(frame: CGRect(',
  'jsonArray?.kj.modelArray(JunZiLanCommodityModel.self)',
  'let viewModel = JunZiLanCommodityViewModel()'
];

expectedSnippets.forEach((snippet) => {
  assert.ok(replaced.includes(snippet), `missing snippet: ${snippet}`);
});

assert.ok(!/\bYNDCYST[A-Z][a-zA-Z0-9_]*\b/.test(replaced), 'old prefix should not remain');
assert.ok(!/JunZiLanJunZiLan[A-Z][a-zA-Z0-9_]*/.test(replaced), 'duplicate new prefix should not appear');

const normalized = normalizeDuplicatePrefixes(
  'let viewModel = JunZiLanJunZiLanSortViewModel()',
  newPrefix
);
assert.strictEqual(normalized, 'let viewModel = JunZiLanSortViewModel()');

const identifiers = extractPrefixedIdentifiers(source, oldPrefix);
assert.deepStrictEqual(
  identifiers,
  [
    'YNDCYSTSortCommodityHeaderView',
    'YNDCYSTShopCartHeaderView',
    'YNDCYSTCommodityViewModel',
    'YNDCYSTCommodityModel',
    'YNDCYSTSortViewModel',
    'YNDCYSTSortItemModel',
    'YNDCYSTSearchView'
  ]
);

console.log('iOS prefix replacement regression tests passed.');
