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
      'food_id': item.food_id,
      'food': item.food
    }

    if (item.brand_id in transformedFoods) {
      transformedFoods[item.brand_id].push(foodObj)
    } else {
      brandMap[item.brand_id] = item.brand
      transformedFoods[item.brand_id] = [foodObj]
    }
  })

  //console.log('brandMap:', brandMap)
  console.log('transformFoods output:', {'id_map': brandMap, 'foods': transformedFoods})
  return {'id_map': brandMap, 'foods': transformedFoods}
}

module.exports = {
  transformCats,
  transformFoods,
  transformNotes,
  transformWeights
}