const assert = require('assert');
const {
  replacePrefixedIdentifiers,
  normalizeDuplicatePrefixes,
  extractPrefixedIdentifiers
} = require('../src/core/android-processor');

const oldPrefix = 'YNDCYST';
const newPrefix = 'JunZiLan';

const source = `
package com.yndcyst.shop.feature

import com.yndcyst.shop.model.YNDCYSTCommodityModel

/**
 * YNDCYSTCommodityViewModel description
 */
enum class YNDCYSTSortType {
    DEFAULT,
    SPECIAL
}

data class YNDCYSTCommodityModel(
    val title: String,
    val type: YNDCYSTSortType
)

sealed class YNDCYSTResult {
    data object Loading : YNDCYSTResult()
    data class Success(val model: YNDCYSTCommodityModel) : YNDCYSTResult()
}

object YNDCYSTConstants {
    const val TAG = "YNDCYSTCommodityModel"
    const val ROUTER = "YNDCYSTSortActivity"
}

class YNDCYSTCommodityViewModel {
    private val identifier = "YNDCYSTCommodityViewModel"
    private val selectedModels = mutableListOf<YNDCYSTCommodityModel>()
    private val sections: List<YNDCYSTSectionModel> = listOf()

    fun buildMapper(): (YNDCYSTCommodityModel) -> YNDCYSTSectionModel = { model ->
        YNDCYSTSectionModel(model.title, YNDCYSTConstants.TAG)
    }

    fun bind(target: YNDCYSTSectionModel?) {
        val result = YNDCYSTSectionModel("title", "desc")
        if (target is YNDCYSTSectionModel) {
            println(YNDCYSTCommodityModel::class.java.simpleName)
        }
    }
}

class YNDCYSTSectionModel(
    val title: String,
    val desc: String
)
`;

const replaced = replacePrefixedIdentifiers(source, oldPrefix, newPrefix);

const expectedSnippets = [
  'enum class JunZiLanSortType',
  'data class JunZiLanCommodityModel(',
  'val type: JunZiLanSortType',
  'sealed class JunZiLanResult',
  'data object Loading : JunZiLanResult()',
  'data class Success(val model: JunZiLanCommodityModel) : JunZiLanResult()',
  'object JunZiLanConstants',
  'const val TAG = "JunZiLanCommodityModel"',
  'const val ROUTER = "JunZiLanSortActivity"',
  'class JunZiLanCommodityViewModel',
  'private val identifier = "JunZiLanCommodityViewModel"',
  'mutableListOf<JunZiLanCommodityModel>()',
  'private val sections: List<JunZiLanSectionModel> = listOf()',
  'fun buildMapper(): (JunZiLanCommodityModel) -> JunZiLanSectionModel = { model ->',
  'JunZiLanSectionModel(model.title, JunZiLanConstants.TAG)',
  'fun bind(target: JunZiLanSectionModel?)',
  'val result = JunZiLanSectionModel("title", "desc")',
  'if (target is JunZiLanSectionModel)',
  'println(JunZiLanCommodityModel::class.java.simpleName)',
  'class JunZiLanSectionModel('
];

expectedSnippets.forEach((snippet) => {
  assert.ok(replaced.includes(snippet), `missing snippet: ${snippet}`);
});

assert.ok(!/\bYNDCYST[A-Z][a-zA-Z0-9_]*\b/.test(replaced), 'old prefix should not remain');
assert.ok(!/JunZiLanJunZiLan[A-Z][a-zA-Z0-9_]*/.test(replaced), 'duplicate new prefix should not appear');

const normalized = normalizeDuplicatePrefixes(
  'const val TAG = "JunZiLanJunZiLanCommodityModel"',
  newPrefix
);
assert.strictEqual(normalized, 'const val TAG = "JunZiLanCommodityModel"');

const identifiers = extractPrefixedIdentifiers(source, oldPrefix);
assert.deepStrictEqual(
  identifiers,
  [
    'YNDCYSTCommodityViewModel',
    'YNDCYSTCommodityModel',
    'YNDCYSTSortActivity',
    'YNDCYSTSectionModel',
    'YNDCYSTConstants',
    'YNDCYSTSortType',
    'YNDCYSTResult'
  ]
);

console.log('Android prefix replacement regression tests passed.');
