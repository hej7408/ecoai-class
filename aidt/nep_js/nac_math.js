/************************************************/
/* Copyright © Namoletter, All rights reserved. */
/************************************************/

// nac_math.js

$(document).ready(function () {
    if (typeof Setter !== typeof undefined)
        return;

    var math = $(".nac_math");
    math.on("touchstart", NacMath.preventDefault);
    math.find(".nac_math_generate_button").on("click touchend", NacMath.onGenerate);
    math.find(".nac_math_show_answer_button").on("click touchend", NacMath.onShowAnswer);
    math.find(".nac_math_show_result_button").on("click touchend", NacMath.onShowResult);
    math.find(".nac_math_init_wrong_button").on("click touchend", NacMath.onInitWrong);
    math.find(".nac_math_init_all_button").on("click touchend", NacMath.onInitAll);
    NacMath.initControlButton(math);
    NacMath.showControlButton(math, true);
});

var NacMath = {};
NacMath.basic = 1;
NacMath.bunsu = 2;
NacMath.debunsu = 3;
NacMath.rest = 4;
NacMath.plus = 1;
NacMath.minus = 2;
NacMath.multiply = 3;
NacMath.divide = 4;
NacMath.plusminus = 5;
NacMath.muldiv = 6;
NacMath.basicHtml =
"<div class='nac_value_container nac_hidden'><input class='nac_math_value1 nac_only_select' type='text' data-remove='false' /></div>";
NacMath.bunsuHtml =
"<div class='nac_term_bunsu nac_hidden'> \
    <div class='nac_value_container nac_hidden'><input class='nac_math_value1 nac_only_select' type='text' data-remove='false' /></div> \
    <div class='nac_bunsu_separator nac_hidden'></div> \
    <div class='nac_value_container nac_hidden'><input class='nac_math_value2 nac_only_select' type='text' data-remove='false' /></div> \
</div>";
NacMath.debunsuHtml =
"<div class='nac_term_debunsu nac_hidden'> \
    <div class='nac_value_container nac_hidden'><input class='nac_math_value3 nac_only_select' type='text' data-remove='false' /></div> \
    <div class='nac_term_bunsu nac_hidden'> \
        <div class='nac_value_container nac_hidden'><input class='nac_math_value1 nac_only_select' type='text' data-remove='false' /></div> \
        <div class='nac_bunsu_separator nac_hidden'></div> \
        <div class='nac_value_container nac_hidden'><input class='nac_math_value2 nac_only_select' type='text' data-remove='false' /></div> \
    </div> \
</div>";
NacMath.restHtml =
"<div class='nac_term_rest nac_hidden'> \
    <div class='nac_value_container nac_hidden'><input class='nac_math_value1 nac_only_select' type='text' /></div><img class='nac_math_dot nac_hidden' src='./nep_image/nac_dot.png' /> \
    <div class='nac_value_container nac_hidden'><input class='nac_math_value2 nac_only_select' type='text' /></div> \
</div>";

NacMath.termValue = function (t, v1, v2, v3) {
    this.type = (t === undefined ? NacMath.basic : t);
    this.value1 = (v1 === undefined ? 0 : v1); // bunja, rest mok
    this.value2 = (v2 === undefined ? 0 : v2); // bunmo, na
    this.value3 = (v3 === undefined ? 0 : v3); // debunsu mok
}

NacMath.setting = function (value) {
    this.valid = false;
    var arr = value.split(",");
    if (arr.length != 32)
        return;

    this.operator = parseInt(arr[0], 10);
    this.leftTermType = parseInt(arr[1], 10);
    this.rightTermType = parseInt(arr[2], 10);

    var v1 = parseInt(arr[3], 10);
    var v2 = parseInt(arr[4], 10);
    this.left1Min = Math.min(v1, v2);
    this.left1Max = Math.max(v1, v2);
    this.left1Besu = parseInt(arr[5], 10);
    this.left1Sosu = parseInt(arr[6], 10);

    v1 = parseInt(arr[7], 10);
    v2 = parseInt(arr[8], 10);
    this.left2Min = Math.min(v1, v2);
    this.left2Max = Math.max(v1, v2);
    this.left2Besu = parseInt(arr[9], 10);

    v1 = parseInt(arr[10], 10);
    v2 = parseInt(arr[11], 10);
    this.left3Min = Math.min(v1, v2);
    this.left3Max = Math.max(v1, v2);
    this.left3Besu = parseInt(arr[12], 10);

    v1 = parseInt(arr[13], 10);
    v2 = parseInt(arr[14], 10);
    this.right1Min = Math.min(v1, v2);
    this.right1Max = Math.max(v1, v2);
    this.right1Besu = parseInt(arr[15], 10);
    this.right1Sosu = parseInt(arr[16], 10);

    v1 = parseInt(arr[17], 10);
    v2 = parseInt(arr[18], 10);
    this.right2Min = Math.min(v1, v2);
    this.right2Max = Math.max(v1, v2);
    this.right2Besu = parseInt(arr[19], 10);

    v1 = parseInt(arr[20], 10);
    v2 = parseInt(arr[21], 10);
    this.right3Min = Math.min(v1, v2);
    this.right3Max = Math.max(v1, v2);
    this.right3Besu = parseInt(arr[22], 10);

    this.sameMo = parseInt(arr[23], 10);
    this.sameJa = parseInt(arr[24], 10);
    this.plusTen = parseInt(arr[25], 10);
    this.minusTen = parseInt(arr[26], 10);

    this.alwaysNa = parseInt(arr[27], 10);
    this.alwaysYak = parseInt(arr[28], 10);
    this.needDebunsu = parseInt(arr[29], 10);

    this.resultSosu = parseInt(arr[30], 10);
    this.resultNeedYak = parseInt(arr[31], 10);
    this.valid = true;

    this.string = function () {
        if (!this.valid)
            return "";
        return this.operator + "," + this.leftTermType + "," + this.rightTermType + ","
        + this.left1Min + "," + this.left1Max + "," + this.left1Besu + "," + this.left1Sosu + ","
        + this.left2Min + "," + this.left2Max + "," + this.left2Besu + ","
        + this.left3Min + "," + this.left3Max + "," + this.left3Besu + ","
        + this.right1Min + "," + this.right1Max + "," + this.right1Besu + "," + this.right1Sosu + ","
        + this.right2Min + "," + this.right2Max + "," + this.right2Besu + ","
        + this.right3Min + "," + this.right3Max + "," + this.right3Besu + ","
        + this.sameMo + "," + this.sameJa + "," + this.plusTen + "," + this.minusTen + ","
        + this.alwaysNa + "," + this.alwaysYak + "," + this.needDebunsu + ","
        + this.resultSosu + "," + this.resultNeedYak;
    }
}

NacMath.preventDefault = function (event) {
    if (event.originalEvent.touches.length > 1)
        return;
    event.preventDefault();
}

NacMath.parentMathElement = function (child) {
    var cur = child.parent();
    while (cur.length > 0) {
        if (cur.hasClass("nac_math"))
            return cur;
        cur = cur.parent();
    }
    return null;
}

NacMath.parentMathItemElement = function (child) {
    var cur = child.parent();
    while (cur.length > 0) {
        if (cur.hasClass("nac_math_item"))
            return cur;
        cur = cur.parent();
    }
    return null;
}

NacMath.initControlButton = function (math) {
    var generate = math.find(".nac_math_generate_button");
    var answer = math.find(".nac_math_show_answer_button");
    var wrong = math.find(".nac_math_init_wrong_button");
    if (generate.hasClass("nac_display_none"))
        generate.remove();
    if (answer.hasClass("nac_display_none"))
        answer.remove();
    if (wrong.hasClass("nac_display_none"))
        wrong.remove();
}

NacMath.showControlButton = function (math, main, hasWrong) {
    if (main) {
        math.find(".nac_math_generate_button").removeClass("nac_display_none");
        math.find(".nac_math_show_result_button").removeClass("nac_display_none");
        math.find(".nac_math_show_answer_button").addClass("nac_display_none");
        math.find(".nac_math_init_all_button").addClass("nac_display_none");
        math.find(".nac_math_init_wrong_button").addClass("nac_display_none");
    }
    else {
        math.find(".nac_math_generate_button").addClass("nac_display_none");
        math.find(".nac_math_show_result_button").addClass("nac_display_none");
        math.find(".nac_math_show_answer_button").removeClass("nac_display_none");
        math.find(".nac_math_init_all_button").removeClass("nac_display_none");
        if (hasWrong)
            math.find(".nac_math_init_wrong_button").removeClass("nac_display_none");
        else
            math.find(".nac_math_init_wrong_button").addClass("nac_display_none");
    }
}

NacMath.value = function (object) {
    if (object.length == 0)
        return;
    return $.nodeName(object[0], "input") ? object.val() : object.html();
}

NacMath.setValue = function (object, value) {
    if (object.length == 0)
        return;
    $.nodeName(object[0], "input") ? object.val(value) : object.html(value);
}

NacMath.termType = function (term) {
    if (term.hasClass("nac_term_type_basic")) 
        return NacMath.basic;
    else if (term.hasClass("nac_term_type_bunsu")) 
        return NacMath.bunsu;
    else if (term.hasClass("nac_term_type_debunsu"))
        return NacMath.debunsu;
    else if (term.hasClass("nac_term_type_rest"))
        return NacMath.rest;
    return -1;
}

NacMath.getTermValue = function (term) {
    var termType = NacMath.termType(term);
    if (termType == NacMath.basic) {
        var value1 = parseFloat(NacMath.value(term.find(".nac_math_value1")));
        return new NacMath.termValue(NacMath.basic, value1);
    }
    else if (termType == NacMath.bunsu) {
        var value1 = Math.round(parseFloat(NacMath.value(term.find(".nac_math_value1"))));
        var value2 = Math.round(parseFloat(NacMath.value(term.find(".nac_math_value2"))));
        return new NacMath.termValue(NacMath.bunsu, value1, value2);
    }
    else if (termType == NacMath.debunsu) {
        var value1 = Math.round(parseFloat(NacMath.value(term.find(".nac_math_value1"))));
        var value2 = Math.round(parseFloat(NacMath.value(term.find(".nac_math_value2"))));
        var value3 = Math.round(parseFloat(NacMath.value(term.find(".nac_math_value3"))));
        return new NacMath.termValue(NacMath.debunsu, value1, value2, value3);
    }
    else if (termType == NacMath.rest) {
        var value1 = Math.round(parseFloat(NacMath.value(term.find(".nac_math_value1"))));
        var value2 = Math.round(parseFloat(NacMath.value(term.find(".nac_math_value2"))));
        return new NacMath.termValue(NacMath.rest, value1, value2);
    }
    return null;
}

NacMath.getOperatorType = function (operator) {
    if (operator.hasClass("nac_operator_plus"))
        return NacMath.plus;
    else if (operator.hasClass("nac_operator_minus"))
        return NacMath.minus;
    else if (operator.hasClass("nac_operator_multiply"))
        return NacMath.multiply;
    else if (operator.hasClass("nac_operator_divide"))
        return NacMath.divide;
    return 0;
}

NacMath.isValidOperator = function (operator) {
    return (operator >= NacMath.plus && operator <= NacMath.divide) ? true : false;
}

NacMath.isValidValueType = function (valueType) {
    return (valueType >= NacMath.basic && valueType <= NacMath.rest) ? true : false;
}

NacMath.debunsuToBunsu = function (value) {
    if (value.type != NacMath.debunsu)
        return false;
    var ja = value.value3 * value.value2 + value.value1;
    value.type = NacMath.bunsu;
    value.value1 = Math.round(ja);
    value.value3 = 0;
    return true;
}

NacMath.basicToBunsu = function (value, jari) {
    if (value.type != NacMath.basic)
        return null;
    var ja = value.value1;
    var mo = 1;
    while (jari--) {
        ja *= 10;
        mo *= 10;
    }
    return new NacMath.termValue(NacMath.bunsu, Math.round(ja), Math.round(mo));
}

NacMath.bunsuToBasic = function (value) {
    if (value.type != NacMath.bunsu)
        return null;
    return new NacMath.termValue(NacMath.basic, value.value1 / value.value2);
}

NacMath.bunsuToDebunsuIfPossible = function (value) {
    if (value.type != NacMath.bunsu || value.value1 <= value.value2)
        return false;
    var mok = Math.floor(value.value1 / value.value2);
    var ja = Math.round(value.value1 % value.value2);
    value.type = NacMath.debunsu;
    value.value1 = ja;
    value.value3 = mok;
    return true;
}

NacMath.bunsuToBasicIfPossible = function (value) {
    if (value.type != NacMath.bunsu || (value.value1 != 0 && value.value2 != 1))
        return false;
    value.type = NacMath.basic;
    return true;
}

NacMath.debunsuToBasicIfPossible = function (value) {
    if (value.type != NacMath.debunsu || value.value1 != 0)
        return false;
    value.type = NacMath.basic;
    value.value1 = value.value3;
    return true;
}

NacMath.restToBasicIfPossible = function (value) {
    if (value.type != NacMath.rest)
        return false;
    if (value.value2 != 0)
        return false;
    value.type = NacMath.basic;
    return true;
}

NacMath.gcd = function (a, b) {
    return b == 0 ? a : NacMath.gcd(b, a % b);
}

NacMath.toGiyakBunsu = function (value) {
    if (value.type != NacMath.bunsu && value.type != NacMath.debunsu)
        return;
    if (!Number.isInteger(value.value1) || !Number.isInteger(value.value2))
        return;
    var gcd = NacMath.gcd(value.value1, value.value2);
    value.value1 = value.value1 / gcd;
    value.value2 = value.value2 / gcd;
}

NacMath.allowedOperation = function (left, right, operator) {
    if (left == null || right == null)
        return false;
    if (!NacMath.isValidOperator(operator))
        return false;
    if (left.type == NacMath.rest || right.type == NacMath.rest)
        return false;
    if (!NacMath.isValidValueType(left.type) || !NacMath.isValidValueType(right.type))
        return false;
    if (left.type != NacMath.basic && left.value2 == 0)
        return false;
    if (right.type != NacMath.basic && right.value2 == 0)
        return false;
    if (operator == NacMath.divide && right.type == NacMath.basic && right.value1 == 0)
        return false;
    return true;
}

NacMath.resultIsRest = function (left, right, operator) {
    if (left.type != NacMath.basic || right.type != NacMath.basic || operator != NacMath.divide)
        return false;
    if (!Number.isInteger(left.value1) || !Number.isInteger(right.value1))
        return false;
    if (left.value1 < 0 || right.value1 <= 0)
        return false;
    return true;
}

NacMath.operate = function (left, right, operator, setting) {
    if (!NacMath.allowedOperation(left, right, operator))
        return null;

    NacMath.debunsuToBunsu(left);
    NacMath.debunsuToBunsu(right);

    if (NacMath.resultIsRest(left, right, operator))
        return new NacMath.termValue(NacMath.rest, Math.floor(left.value1 / right.value1), left.value1 % right.value1);
    if (left.type == NacMath.basic && right.type == NacMath.bunsu)
        return NacMath.operateBasicAndBunsu(left, right, operator, setting.left1Sosu);
    if (left.type == NacMath.bunsu && right.type == NacMath.basic)
        return NacMath.operateBunsuAndBasic(left, right, operator, setting.right1Sosu);
    if (left.type == NacMath.bunsu && right.type == NacMath.bunsu)
        return NacMath.operateBunsuAndBunsu(left, right, operator);
    if (left.type == NacMath.basic && right.type == NacMath.basic)
        return NacMath.operateBasicAndBasic(left, right, operator);
    return null;
}

NacMath.operateBasicAndBunsu = function (basicValue, bunsuValue, operator, jari) {
    if (jari > 0) { // 분수 & 소수 = 소수
        var basicFromBunsu = NacMath.bunsuToBasic(bunsuValue);
        return NacMath.operateBasicAndBasic(basicValue, basicFromBunsu, operator);
    }
    var bunsuFromBasic = NacMath.basicToBunsu(basicValue, jari);
    return NacMath.operateBunsuAndBunsu(bunsuFromBasic, bunsuValue, operator);
}

NacMath.operateBunsuAndBasic = function (bunsuValue, basicValue, operator, jari) {
    if (jari > 0) { // 분수 & 소수 = 소수
        var basicFromBunsu = NacMath.bunsuToBasic(bunsuValue);
        return NacMath.operateBasicAndBasic(basicFromBunsu, basicValue, operator);
    }
    var bunsuFromBasic = NacMath.basicToBunsu(basicValue, jari);
    return NacMath.operateBunsuAndBunsu(bunsuValue, bunsuFromBasic, operator);
}

NacMath.operateBunsuAndBunsu = function (left, right, operator) {
    if (left == null || right == null)
        return null;
    if (operator == NacMath.plus)
        return new NacMath.termValue(NacMath.bunsu, Math.round(left.value1 * right.value2 + right.value1 * left.value2), Math.round(left.value2 * right.value2));
    else if (operator == NacMath.minus)
        return new NacMath.termValue(NacMath.bunsu, Math.round(left.value1 * right.value2 - right.value1 * left.value2), Math.round(left.value2 * right.value2));
    else if (operator == NacMath.multiply)
        return new NacMath.termValue(NacMath.bunsu, Math.round(left.value1 * right.value1), Math.round(left.value2 * right.value2));
    else if (operator == NacMath.divide)
        return new NacMath.termValue(NacMath.bunsu, Math.round(left.value1 * right.value2), Math.round(left.value2 * right.value1));
    return null;
}

NacMath.operateBasicAndBasic = function (left, right, operator) {
    if (operator == NacMath.plus)
        return new NacMath.termValue(NacMath.basic, left.value1 + right.value1);
    if (operator == NacMath.minus)
        return new NacMath.termValue(NacMath.basic, left.value1 - right.value1);
    if (operator == NacMath.multiply)
        return new NacMath.termValue(NacMath.basic, left.value1 * right.value1);
    if (operator == NacMath.divide)
        return new NacMath.termValue(NacMath.basic, left.value1 / right.value1);
    return null;
}

NacMath.sosuJari = function (setting) {
    var jari = setting.resultSosu;
    if (jari <= 0)
        jari = Math.max(setting.left1Sosu, setting.right1Sosu);
    return jari;
}

NacMath.isSameValue = function (result, solution, setting) {
    NacMath.debunsuToBunsu(result);
    NacMath.debunsuToBunsu(solution);
    if (setting.resultNeedYak == 0)
        NacMath.toGiyakBunsu(result);
    NacMath.toGiyakBunsu(solution);
    NacMath.bunsuToBasicIfPossible(result);
    NacMath.bunsuToBasicIfPossible(solution);
    NacMath.restToBasicIfPossible(result);
    NacMath.restToBasicIfPossible(solution);
    if (result.type != solution.type)
        return false;

    if (result.type == NacMath.bunsu)
        return result.value1 == solution.value1 && result.value2 == solution.value2;
    else if (result.type == NacMath.rest)
        return result.value1 == solution.value1 && result.value2 == solution.value2;
    else if (result.type == NacMath.basic) {
        var jari = NacMath.sosuJari(setting);
        return result.value1.toFixed(jari) == solution.value1.toFixed(jari);
    }
    return false;
}

NacMath.answerIsRight = function (item, setting) {
    var leftValue = NacMath.getTermValue(item.find(".nac_math_term_left"));
    var rightValue = NacMath.getTermValue(item.find(".nac_math_term_right"));
    var resultValue = NacMath.getTermValue(item.find(".nac_math_term_result"));
    var operatorType = NacMath.getOperatorType(item.find(".nac_math_operator"));
    var solutionValue = NacMath.operate(leftValue, rightValue, operatorType, setting);
    var result = NacMath.isSameValue(resultValue, solutionValue, setting);
    if (!result)
        item.addClass("nac_math_item_wrong");
    return result;
}

NacMath.showItemResult = function (item, setting) {
    var result = NacMath.answerIsRight(item, setting);
    var resultImg = result ? item.find(".nac_math_result_o") : item.find(".nac_math_result_x");
    resultImg.css({
        "display": "inline",
        "position": "absolute",
        "opacity": "0",
    });

    setTimeout(function () {
        var left = item.width() > resultImg.width() ? (item.width() - resultImg.width()) / 2 : 0;
        var top = item.height() > resultImg.height() ? (item.height() - resultImg.height()) / 2 : 0;
        resultImg.css({
            "left": left + "px",
            "top": top + "px",
            "opacity": "0.7"
        });
    }, 0);
    return result;
}

NacMath.showItemAnswer = function (item, setting) {
    var leftValue = NacMath.getTermValue(item.find(".nac_math_term_left"));
    var rightValue = NacMath.getTermValue(item.find(".nac_math_term_right"));
    var operatorType = NacMath.getOperatorType(item.find(".nac_math_operator"));
    var solutionValue = NacMath.operate(leftValue, rightValue, operatorType, setting);

    var result = item.find(".nac_math_term_result");
    var value1 = result.find(".nac_math_value1").val("");
    var value2 = result.find(".nac_math_value2").val("");
    var value3 = result.find(".nac_math_value3").val("");
    var termType = NacMath.termType(result);
    if (termType == NacMath.basic) {
        NacMath.toGiyakBunsu(solutionValue);
        NacMath.bunsuToBasicIfPossible(solutionValue);
        NacMath.restToBasicIfPossible(solutionValue);
        if (solutionValue.type == NacMath.basic) {
            if (isNaN(solutionValue.value1))
                return;
            var jari = NacMath.sosuJari(setting);
            var value = solutionValue.value1.toFixed(jari);
            NacMath.setValue(value1, Number(value)); // 1.50 => 1.5
        }
    }
    else if (termType == NacMath.bunsu) {
        NacMath.toGiyakBunsu(solutionValue);
        if (solutionValue.type == NacMath.bunsu) {
            if (isNaN(solutionValue.value1) || isNaN(solutionValue.value2))
                return;
            NacMath.setValue(value1, Math.round(solutionValue.value1));
            NacMath.setValue(value2, Math.round(solutionValue.value2));
        }
    }
    else if (termType == NacMath.debunsu) {
        NacMath.toGiyakBunsu(solutionValue);
        NacMath.bunsuToDebunsuIfPossible(solutionValue);
        if (solutionValue.type == NacMath.debunsu) {
            if (isNaN(solutionValue.value1) || isNaN(solutionValue.value2) || isNaN(solutionValue.value3))
                return;
            NacMath.setValue(value1, solutionValue.value1);
            NacMath.setValue(value2, solutionValue.value2);
            NacMath.setValue(value3, solutionValue.value3);
        }
    }
    else if (termType == NacMath.rest) {
        if (solutionValue.type == NacMath.rest) {
            if (isNaN(solutionValue.value1) || isNaN(solutionValue.value2))
                return;
            NacMath.setValue(value1, solutionValue.value1);
            NacMath.setValue(value2, solutionValue.value2);
        }
    }
}

NacMath.hideItemResult = function (item) {
    var resultO = item.find(".nac_math_result_o").css("opacity", "0");
    var resultX = item.find(".nac_math_result_x").css("opacity", "0");
    setTimeout(function () {
        resultO.css("display", "");
        resultX.css("display", "");
    }, 300);
}

NacMath.initItem = function (items) {
    NacMath.hideItemResult(items);
    items.removeClass("nac_math_item_wrong");
    items.find(".nac_math_term_result input").val("");
    return items;
}

NacMath.onShowAnswer = function () {
    var math = NacMath.parentMathElement($(this));
    var setting = new NacMath.setting(math.attr("data-setting"));
    if (!setting.valid) {
        alert("configuration is not valid!")
        return;
    }

    math.find(".nac_math_item").each(function () {
        NacMath.showItemAnswer($(this), setting);
    });
}

NacMath.onShowResult = function () {
    var math = NacMath.parentMathElement($(this));
    var setting = new NacMath.setting(math.attr("data-setting"));
    if (!setting.valid) {
        alert("configuration is not valid!")
        return;
    }

    var hasWrong = false;
    math.find(".nac_math_item").each(function () {
        if (!NacMath.showItemResult($(this), setting))
            hasWrong = true;
    });
    NacMath.showControlButton(math, false, hasWrong);
}

NacMath.onInitWrong = function () {
    var math = NacMath.parentMathElement($(this));
    NacMath.initItem(math.find(".nac_math_item_wrong"));
    NacMath.showControlButton(math, true);
}

NacMath.onInitAll = function () {
    var math = NacMath.parentMathElement($(this));
    NacMath.initItem(math.find(".nac_math_item"));
    NacMath.showControlButton(math, true);
}

NacMath.onGenerate = function () {
    var math = NacMath.parentMathElement($(this));
    var setting = new NacMath.setting(math.attr("data-setting"));
    if (!setting.valid) {
        alert("configuration is not valid!")
        return;
    }

    NacMath.initItem(math.find(".nac_math_item")).each(function () {
        NacMath.generateQuestion($(this), setting);
    });
}

NacMath.generateQuestion = function (item, setting) {
    var left = item.find(".nac_math_term_left");
    var leftTermType = NacMath.termType(left);
    var right = item.find(".nac_math_term_right");
    var rightTermType = NacMath.termType(right);
    var result = item.find(".nac_math_term_result");
    var operator = NacMath.getOperatorType(item.find(".nac_math_operator"));
    var leftValue = NacMath.generateLeftValue(left, leftTermType, rightTermType, operator, setting);
    var rightValue = NacMath.generateRightValue(right, leftTermType, rightTermType, operator, setting, leftValue);
    NacMath.generateResultHtml(result, operator, setting, leftValue, rightValue);
}

NacMath.random = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

NacMath.getRandomValue = function (min, max, sosu, besu) {
    var value = NacMath.random(min, max);
    if (besu > 1) {
        var na = value % besu;
        if (value - na >= 0)
            value -= na;
        else if (value - na + besu >= max)
            value += besu - na;
    }
    if (sosu > 0) {
        var sum = (value + Math.random()).toFixed(sosu);
        while (sum[sum.length - 1] == "0") // 소수점 자리가 유효하도록
            sum = (value + Math.random()).toFixed(sosu);
        value = Number(sum);
    }
    return value;
}

NacMath.isSimpleAndSimple = function (leftTermType, rightTermType, setting) {
    if (leftTermType != NacMath.basic || rightTermType != NacMath.basic)
        return false;
    if (setting.left1Sosu > 0 || setting.right1Sosu > 0)
        return false;
    return true;
}

NacMath.adjustLeftPlusTen = function (value, option) {
    if (option == 1) { // 마지막 자리수 합이 10을 넘지 않도록
        if ((value % 10) == 9)
            value -= (9 - NacMath.random(1, 8));
    }
    else if (option == 2) { // 마지막 자리수 합이 10을 넘도록
        if ((value % 10) == 0)
            value += NacMath.random(1, 9);
    }
    return value;
}

NacMath.adjustLeftMinusTen = function (value, option) {
    if (option == 1) { // 마지막 자리수 차가 양수가 되도록
        if ((value % 10) == 0)
            value += NacMath.random(1, 9);
    }
    else if (option == 2) { // 마지막 자리수 차가 음수가 되도록
        if ((value % 10) == 9)
            value -= (9 - NacMath.random(1, 8));
    }
    return value;
}

NacMath.adjustRightPlusTen = function (leftValue, rightValue, option) {
    if (option == 1) { // 마지막 자리수 합이 10을 넘지 않도록
        var leftNa = (leftValue % 10);
        var rightNa = (rightValue % 10);
        if (leftNa + rightNa >= 10) {
            var newRightNa = NacMath.random(1, 10 - leftNa - 1);
            rightValue -= (rightNa - newRightNa);
        }
    }
    else if (option == 2) { // 마지막 자리수 합이 10을 넘도록
        var leftNa = (leftValue % 10);
        var rightNa = (rightValue % 10);
        if (leftNa + rightNa < 10) {
            var newRightNa = NacMath.random(10 - leftNa, 9);
            rightValue -= (rightNa - newRightNa);
        }
    }
    return rightValue;
}

NacMath.adjustRightMinusTen = function (leftValue, rightValue, option) {
    if (option == 1) { // 마지막 자리수 차가 양수가 되도록
        var leftNa = (leftValue % 10);
        var rightNa = (rightValue % 10);
        if (leftNa - rightNa < 0) {
            var newRightNa = NacMath.random(1, leftNa);
            rightValue -= (rightNa - newRightNa);
        }
    }
    else if (option == 2) { // 마지막 자리수 차가 음수가 되도록
        var leftNa = (leftValue % 10);
        var rightNa = (rightValue % 10);
        if (leftNa - rightNa >= 0) {
            var newRightNa = NacMath.random(leftNa + 1, 9);
            rightValue -= (rightNa - newRightNa);
        }
    }
    return rightValue;
}

NacMath.toFloat = function (value) {
    if (value.type == NacMath.basic)
        return value.value1;
    if (value.type == NacMath.bunsu)
        return value.value1 / value.value2;
    if (value.type == NacMath.debunsu)
        return value.value3 + value.value1 / value.value2;
    return 0;
}

// 뺄셈 결과가 0보다 크거나 같도록 최소한의 수 설정
NacMath.adjustLeftValueForMinusOperation = function (leftValue, rightTermType, operator, setting) {
    if (operator != NacMath.minus)
        return;

    var min = (rightTermType == NacMath.debunsu ? 2 : 1);
    if (NacMath.toFloat(leftValue) >= min)
        return

    if (leftValue.type == NacMath.basic) {
        var max = Math.max(min, setting.left1Max);
        var sosu = leftValue.value1 - Math.floor(leftValue.value1);
        leftValue.value1 = NacMath.random(min, max) + sosu;
    }
    else if (leftValue.type == NacMath.bunsu) {
        min = min * leftValue.value2;
        var max = Math.max(min, setting.left1Max);
        leftValue.value1 = Math.round(NacMath.random(min, max));
    }
    else if (leftValue.type == NacMath.debunsu) {
        var max = Math.max(min, setting.left3Max);
        leftValue.value3 = Math.round(NacMath.random(min, max));
    }
}

// 뺄셈 결과가 0보다 크거나 같도록 설정
NacMath.adjustRightValueForMinusOperation = function (leftValue, rightValue, operator, setting) {
    if (operator != NacMath.minus)
        return;

    var leftFloat = NacMath.toFloat(leftValue);
    var rightFloat = NacMath.toFloat(rightValue);
    if (leftFloat >= rightFloat)
        return;

    var max = Math.floor(leftFloat);
    if (rightValue.type == NacMath.basic) {
        max = Math.min(setting.right1Sosu > 0 ? max - 1 : max, setting.right1Max);
        var sosu = rightValue.value1 - Math.floor(rightValue.value1);
        rightValue.value1 = NacMath.random(Math.min(max, setting.right1Min), max) + sosu;
    }
    else if (rightValue.type == NacMath.bunsu) {
        max = max * rightValue.value2;
        var min = Math.min(max, Math.max(1, setting.right1Min));
        rightValue.value1 = NacMath.random(min, max);
    }
    else if (rightValue.type == NacMath.debunsu) {
        max = max * rightValue.value2 - 1;
        var min = Math.min(max, Math.max(1, setting.right1Min)) + rightValue.value2;
        var value = NacMath.random(min, max);
        rightValue.value1 = (value % rightValue.value2);
        rightValue.value3 = Math.floor(value / rightValue.value2);
    }
}

NacMath.makeLeftJa = function (setting, mo) {
    var min = Math.max(setting.left1Min, 1);
    var max = Math.max(setting.left1Max, 1);
    if (mo > 0)
        max = Math.min(max, mo - 1);
    return NacMath.getRandomValue(min, max, 0, setting.left1Besu);
}

NacMath.makeLeftMo = function (setting, isDebunsu) {
    var min = Math.max(setting.left2Min, isDebunsu ? 2 : 1);
    var max = Math.max(setting.left2Max, isDebunsu ? 2 : 1);
    return NacMath.getRandomValue(min, max, 0, setting.left2Besu);
}

NacMath.makeLeftMok = function (setting) {
    return NacMath.getRandomValue(Math.max(setting.left3Min, 1), Math.max(setting.left3Max, 1), 0, setting.left3Besu);
}

NacMath.makeRightJa = function (leftValue, setting, mo) {
    if (setting.sameJa == 1
        && leftValue.value1 < (mo > 0 ? mo : Number.MAX_VALUE)
        && (leftValue.type == NacMath.bunsu || leftValue.type == NacMath.debunsu))
        return leftValue.value1;
    var min = Math.max(setting.right1Min, 1);
    var max = Math.max(setting.right1Max, 1);
    if (mo > 0)
        max = Math.min(max, mo - 1);
    return NacMath.getRandomValue(min, max, 0, setting.right1Besu);
}

NacMath.makeRightMo = function (leftValue, setting, isDebunsu) {
    if (setting.sameMo == 1
        && leftValue.value2 >= (isDebunsu ? 2 : 1)
        && (leftValue.type == NacMath.bunsu || leftValue.type == NacMath.debunsu))
        return leftValue.value2;
    var min = Math.max(setting.right2Min, isDebunsu ? 2 : 1);
    var max = Math.max(setting.right2Max, isDebunsu ? 2 : 1);
    return NacMath.getRandomValue(min, max, 0, setting.right2Besu);
}

NacMath.makeRightMok = function (setting) {
    return NacMath.getRandomValue(Math.max(setting.right3Min, 1), Math.max(setting.right3Max, 1), 0, setting.right3Besu);
}

NacMath.generateLeftValue = function (left, leftTermType, rightTermType, operator, setting) {
    var leftValue = null;
    if (leftTermType == NacMath.basic) {
        var value1 = NacMath.getRandomValue(setting.left1Min, setting.left1Max, setting.left1Sosu, setting.left1Besu);
        if (NacMath.isSimpleAndSimple(leftTermType, rightTermType, setting)) {
            if (operator == NacMath.plus)
                value1 = NacMath.adjustLeftPlusTen(value1, setting.plusTen);
            else if (operator == NacMath.minus)
                value1 = NacMath.adjustLeftMinusTen(value1, setting.minusTen);
        }
        leftValue = new NacMath.termValue(NacMath.basic, value1);
        NacMath.adjustLeftValueForMinusOperation(leftValue, rightTermType, operator, setting);
        NacMath.setValue(left.find(".nac_math_value1"), Number(leftValue.value1.toFixed(setting.left1Sosu)));
    }
    else if (leftTermType == NacMath.bunsu) {
        var value1 = NacMath.makeLeftJa(setting, 0);
        var value2 = NacMath.makeLeftMo(setting, false);
        leftValue = new NacMath.termValue(NacMath.bunsu, value1, value2);
        NacMath.adjustLeftValueForMinusOperation(leftValue, rightTermType, operator, setting);
        if (setting.alwaysYak == 1)
            NacMath.toGiyakBunsu(leftValue);
        NacMath.setValue(left.find(".nac_math_value1"), leftValue.value1);
        NacMath.setValue(left.find(".nac_math_value2"), leftValue.value2);
    }
    else if (leftTermType == NacMath.debunsu) {
        var value2 = NacMath.makeLeftMo(setting, true);
        var value1 = NacMath.makeLeftJa(setting, value1);
        var value3 = NacMath.makeLeftMok(setting);
        leftValue = new NacMath.termValue(NacMath.debunsu, value1, value2, value3);
        NacMath.adjustLeftValueForMinusOperation(leftValue, rightTermType, operator, setting);
        if (setting.alwaysYak == 1)
            NacMath.toGiyakBunsu(leftValue);
        NacMath.setValue(left.find(".nac_math_value1"), leftValue.value1);
        NacMath.setValue(left.find(".nac_math_value2"), leftValue.value2);
        NacMath.setValue(left.find(".nac_math_value3"), leftValue.value3);
    }
    return leftValue;
}

NacMath.generateRightValue = function (right, leftTermType, rightTermType, operator, setting, leftValue) {
    var rightValue = null;
    if (rightTermType == NacMath.basic) {
        var value1 = NacMath.getRandomValue(setting.right1Min, setting.right1Max, setting.right1Sosu, setting.right1Besu);
        if (NacMath.isSimpleAndSimple(leftTermType, rightTermType, setting)) {
            if (operator == NacMath.plus)
                value1 = NacMath.adjustRightPlusTen(leftValue.value1, value1, setting.plusTen);
            else if (operator == NacMath.minus)
                value1 = NacMath.adjustRightMinusTen(leftValue.value1, value1, setting.minusTen);
        }
        rightValue = new NacMath.termValue(NacMath.basic, value1);
        NacMath.adjustRightValueForMinusOperation(leftValue, rightValue, operator, setting);
        NacMath.setValue(right.find(".nac_math_value1"), Number(rightValue.value1.toFixed(setting.right1Sosu)));
    }
    else if (rightTermType == NacMath.bunsu) {
        var value1 = NacMath.makeRightJa(leftValue, setting, 0);
        var value2 = NacMath.makeRightMo(leftValue, setting, false);
        rightValue = new NacMath.termValue(NacMath.bunsu, value1, value2);
        NacMath.adjustRightValueForMinusOperation(leftValue, rightValue, operator, setting);
        if (setting.alwaysYak == 1)
            NacMath.toGiyakBunsu(rightValue);
        NacMath.setValue(right.find(".nac_math_value1"), rightValue.value1);
        NacMath.setValue(right.find(".nac_math_value2"), rightValue.value2);
    }
    else if (rightTermType == NacMath.debunsu) {
        var value2 = NacMath.makeRightMo(leftValue, setting, true);
        var value1 = NacMath.makeRightJa(leftValue, setting, value2);
        var value3 = NacMath.makeRightMok(setting);
        rightValue = new NacMath.termValue(NacMath.debunsu, value1, value2, value3);
        NacMath.adjustRightValueForMinusOperation(leftValue, rightValue, operator, setting);
        if (setting.alwaysYak == 1)
            NacMath.toGiyakBunsu(rightValue);
        NacMath.setValue(right.find(".nac_math_value1"), rightValue.value1);
        NacMath.setValue(right.find(".nac_math_value2"), rightValue.value2);
        NacMath.setValue(right.find(".nac_math_value3"), rightValue.value3);
    }
    return rightValue;
}

NacMath.generateResultHtml = function (result, operator, setting, leftValue, rightValue) {
    var desiredType = NacMath.basic;
    if (setting.left1Sosu > 0 || setting.right1Sosu > 0)
        desiredType = NacMath.basic;
    else if (leftValue.type == NacMath.debunsu || rightValue.type == NacMath.debunsu) {
        desiredType = NacMath.debunsu;
        var resultValue = NacMath.operate(leftValue, rightValue, operator, setting);
        if ((resultValue.value1 % resultValue.value2) == 0)
            desiredType = NacMath.basic;
        else if (resultValue.value1 < resultValue.value2)
            desiredType = NacMath.bunsu;
    }
    else if (leftValue.type == NacMath.bunsu || rightValue.type == NacMath.bunsu) {
        desiredType = NacMath.bunsu;
        var resultValue = NacMath.operate(leftValue, rightValue, operator, setting);
        if ((resultValue.value1 % resultValue.value2) == 0)
            desiredType = NacMath.basic;
        else if (resultValue.value1 > resultValue.value2 && setting.needDebunsu == 1)
            desiredType = NacMath.debunsu;
    }
    else if (setting.left1Sosu == 0 && setting.right1Sosu == 0 && operator == NacMath.divide) {
        desiredType = NacMath.rest;
        if (setting.alwaysNa == 0) {
            var na = leftValue.value1 % rightValue.value1;
            if (na == 0)
                desiredType = NacMath.basic;
        }
    }
    if (desiredType == NacMath.termType(result))
        return;

    result.removeClass("nac_term_type_basic nac_term_type_bunsu nac_term_type_debunsu nac_term_type_rest");
    if (desiredType == NacMath.basic) {
        result.addClass("nac_term_type_basic");
        result.html(NacMath.basicHtml);
    }
    else if (desiredType == NacMath.bunsu) {
        result.addClass("nac_term_type_bunsu");
        result.html(NacMath.bunsuHtml);
    }
    else if (desiredType == NacMath.debunsu) {
        result.addClass("nac_term_type_debunsu");
        result.html(NacMath.debunsuHtml);
    }
    else if (desiredType == NacMath.rest) {
        result.addClass("nac_term_type_rest");
        result.html(NacMath.restHtml);
    }
}





