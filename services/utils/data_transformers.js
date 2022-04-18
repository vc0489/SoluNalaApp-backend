const moment = require('moment')
const format_datetime_to_date = datetime => moment(datetime).format('YYYY-MM-DD')
const format_time_without_sec = time => moment(time, 'HH:mm:ss').format('HH:mm')

const formatDatetimeWithoutSec = datetime => moment(datetime).format('YYYY-MM-DD HH:mm')

const allow_null_wrapper = transform => {
  return value => {
    if (value == null) {
      return null
    }
    return transform(value)
  }

}
const _transformObj = (obj, mapping) => {
  output = {}
  for (field in mapping) {
    if (field in obj) {
      if (typeof mapping[field] === "string") {
        output[mapping[field]] = obj[field]
      } else { //Apply function
        output[mapping[field][0]] = mapping[field][1](obj[field])
      }
    }
  }
  return output
}

const transformObj = (objs, mapping) => {
  let transformedObjs
  if (Array.isArray(objs)) {
    transformedObjs = objs.map(row => _transformObj(row, mapping))
  } else {
    transformedObjs = _transformObj(objs, mapping)
  }
  return transformedObjs
}

catFieldsSqlToObj = {
  id: "id",
  cat_name: "name",
  birthdate: ["birthdate", allow_null_wrapper(format_datetime_to_date)],
  breed: "breed",
  colour: "colour",
}

catFieldsObjToSql = {
  id: "id",
  user_id: "user_id",
  name: "cat_name",
  birthdate: ["birthdate", allow_null_wrapper(format_datetime_to_date)],
  breed: "breed",
  colour: "colour"
}

foodBrandFieldsSqlToObj = {
  id: "id",
  brand_name: "brand"
}

foodProductsSqlToObj = {
  product_id: "id",
  brand_id: "brand_id",
  brand_name: "brand",
  product: "product"
}

foodRatingFieldsSqlToObj = {
  id: "id",
  cat_id: "cat_id",
  rating_date: ["date", format_datetime_to_date],
  brand_id: "brand_id",
  product_id: "product_id",
  rating: "rating"
}

foodRatingFieldsObjToSql = {
  id: "id",
  cat_id: "cat_id",
  date: ["rating_date", format_datetime_to_date],
  product_id: "product_id",
  rating: "rating"
}

noteFieldsObjToSqlV2 = {
  id: "id",
  start_datetime: ["note_datetime_start", formatDatetimeWithoutSec],
  end_datetime: ["note_datetime_end", allow_null_wrapper(formatDatetimeWithoutSec)],
  cat_id: "cat_id",
  type_id: "note_type_id",
  content: "content",
}
noteFieldsSqlToObjV2 = {
  id: "id",
  note_datetime_start: ["start_datetime", formatDatetimeWithoutSec],
  note_datetime_start: ["end_datetime", allow_null_wrapper(formatDatetimeWithoutSec)],
  cat_id: "cat_id",
  type_description: "type",
  note_type_id: "type_id",
  content: "content",
}

noteFieldsSqlToObj = {
  id: "id",
  note_date: ["date", format_datetime_to_date],
  note_time: ["time", allow_null_wrapper(format_time_without_sec)],
  cat_id: "cat_id",
  type_description: "type",
  note_type_id: "type_id",
  content: "content"
}

noteFieldsObjToSql = {
  id: "id",
  date: ["note_date", format_datetime_to_date],
  time: "note_time",
  cat_id: "cat_id",
  //type: "type_description",
  type_id: "note_type_id",
  content: "content"
}

noteTypeFieldsSqlToObj = {
  id: "id",
  type_description: "description"
}

noteTypeFieldsObjToSql = {
  description: "type_description",
  id: "id"
}

weightsFieldsObjToSql = {
  id: "id",
  cat_id: "cat_id",
  date: ["weigh_date", format_datetime_to_date],
  grams: "grams",
}

const transformCats = rows => {
 return transformObj(rows, catFieldsSqlToObj)
}

const transformCatsToSql = data => {
  return transformObj(data, catFieldsObjToSql)
}

const transformWeights = rows => {
  if (!rows) return []

  return rows.map(row => {
    return ({
      id: row.id,
      cat_id: row.cat_id,
      grams: row.grams,
      date: format_datetime_to_date(row.weigh_date)
    })
  })
}
const transformWeightsToSql = data => transformObj(data, weightsFieldsObjToSql)

const transformNotes = rows => transformObj(rows, noteFieldsSqlToObj)
const transformNotesToSql = data => transformObj(data, noteFieldsObjToSql)
const transformNotesV2 = rows => transformObj(rows, noteFieldsSqlToObjV2)
const transformNotesToSqlV2 = data => transformObj(data, noteFieldsObjToSqlV2)
const transformNoteTypes = rows => transformObj(rows, noteTypeFieldsSqlToObj)
const transformNoteTypesToSql = data => transformObj(data, noteTypeFieldsObjToSql)

const transformFoodBrands = rows => transformObj(rows, foodBrandFieldsSqlToObj)
const transformFoodProducts = rows => transformObj(rows, foodProductsSqlToObj)
const transformFoodRatings = rows => transformObj(rows, foodRatingFieldsSqlToObj)
const transformFoodRatingsToSql = data => transformObj(data, foodRatingFieldsObjToSql)

const transformFoodProductsMapped = rows => {
  let transformedFoods = {}
  let foodObj
  let brandMap = {}
  rows.forEach(item => {
    foodObj = {
      'product_id': item.product_id,
      'product': item.product
    }

    if (item.brand in transformedFoods) {
      transformedFoods[item.brand].push(foodObj)
    } else {
      brandMap[item.brand_name] = item.brand_id
      if (foodObj.product === null) {
        transformedFoods[item.brand_name] = []
      } else {
        transformedFoods[item.brand_name] = [foodObj]
      }
    }
  })

  return {'brand_to_id_map': brandMap, 'foods': transformedFoods}
}

const transformFoodRatingsOld = rows => {
  if (!rows) return []

  return rows.map(row => {
    return ({
      ...row,
      date: format_datetime_to_date(row.date)
    })
  })
}

module.exports = {
  transformCats,
  transformCatsToSql,
  transformFoodBrands,
  transformFoodProducts,
  transformFoodProductsMapped,
  transformFoodRatings,
  transformFoodRatingsToSql,
  transformNotes,
  transformNotesToSql,
  transformNotesV2,
  transformNotesToSqlV2,
  transformNoteTypes,
  transformNoteTypesToSql,
  transformWeights,
  transformWeightsToSql,
}