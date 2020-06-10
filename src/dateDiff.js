const dateDiff = (d1,d2)=>{
    // console.log(d1,d2)
    const date1 = new Date(d1);
    // console.log(date1.getMonth())
    const date2 = new Date(d2);
    
    const diffDays = parseInt((date2 - date1) / (1000 * 60 * 60 * 24));

    return diffDays;
}

exports.dateDiff = dateDiff;