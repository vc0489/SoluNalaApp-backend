const moment = require('moment')
const format_datetime_to_date = (datetime) => moment(datetime).format('YYYY-MM-DD')

const transformCats = (rows) => {
  return rows.map(row => {
    return ({
      id: row.id,
      name: row.cat_name,
      birthdate: format_datetime_to_date(row.birthdate),
      breed: row.breed,
      colour: row.colour
    })
  })
}

const transformWeights = rows => {
  if (!rows) {
    return []
  }
  return rows.map(row => {
    return ({
      cat_id: row.cat_id,
      grams: row.grams,
      date: format_datetime_to_date(row.weigh_date)
    })
  })
}

const transformNotes = rows => {
  return rows.map(row => {
    return ({
      ...row,
      date: format_datetime_to_date(row.date)
    })
  })
}

const transformFoods = rows => {
  console.log('In transform foods')
  let transformedFoods = {}
  let foodObj
  let brandMap = {}
  rows.forEach(item => {
    //console.log(item)
    foodObj = {
      'product_id': item.product_id,
      'product': item.product
    }

    if (item.brand in transformedFoods) {
      transformedFoods[item.brand].push(foodObj)
    } else {
      brandMap[item.brand] = item.brand_id
      transformedFoods[item.brand] = [foodObj]
    }
  })

  //console.log('brandMap:', brandMap)
  console.log('transformFoods output:', {'brand_to_id_map': brandMap, 'foods': transformedFoods})
  return {'brand_to_id_map': brandMap, 'foods': transformedFoods}
}

module.exports = {
  transformCats,
  transformFoods,
  transformNotes,
  transformWeights
}