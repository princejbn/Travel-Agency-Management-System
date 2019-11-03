var html = require('html');
var mysql = require('mysql');
var express = require('express');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({
    extended: false
});


var session = require('cookie-session');

var app = express();
var today = new Date();


var con = mysql.createConnection({
    host: "localhost",
    user: "root",//"project",
    password: "pks8o84!", //"project@123",
    database: "project",
    multipleStatements: true
});
con.connect(function(err) {
    if (err) throw err;
    else
        console.log('Connected to database and server started at port 8080');
});

app.use(express.static(__dirname + '/static'));

app.use(cookieParser());
app.use(session({
    secret: 'top_secret',
    // resave: false,
    // saveUninitialized: true,
    cookie: {
        secure: true,
        maxage: 60000
    }
}));


app.use(function(req, res, next) {
    if (typeof(req.session.customer) == 'undefined') {
        req.session.user = '';
        req.session.body = {};
        req.session.customer = [];
        req.session.redirect = '/';
    }


    next();
});

function fetchCustomer(req, res) {
    con.query('select * from customer where customer_username=?', [req.session.user], function(err, result) {
        if (result.length > 0)
            req.session.customer = result;
        else
           throw err;
        res.redirect(req.session.redirect);
        if (req.session.redirect != '/')
            req.session.redirect = '/';
        // console.log(req.session.customer); 
    });
}

function getDate() {
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if (dd < 10)
        dd = '0' + dd;
    if (mm < 10)
        mm = '0' + mm;
    today = yyyy + '-' + mm + '-' + dd;
    console.log(today);
}

getDate();

app.get('/', function(req, res) {
        console.log(req.cookies.session);
        // console.log(req.session);
        res.redirect('/index');
    })
    .get('/index', function(req, res) {
        if (typeof(req.session.customer) != 'undefined' && req.session.customer.length > 0)
            res.redirect('/home');
        else
            res.render('index.ejs', {
                user: req.session.user
            })
    })
    .get('/about', function(req, res) {
        res.render('about.ejs');
    })
    .get('/flights', function(req, res) {
    	if(req.session.user!='')
    		res.redirect('/home?task=book_flight');
    	var sql='call get_flights()';
    	con.query(sql,function(err,result,fields){
          res.render('flights.ejs', {
            user: req.session.user,
            result:result[0]
        });
    	});
    })
    .get('/hotels', function(req, res) {
    	if(req.session.user!='')
    		res.redirect('/home?task=book_hotel');
        var sql='call get_hotels()';
    	con.query(sql,function(err,result,fields){
          res.render('hotels.ejs', {
            user: req.session.user,
            result:result[0]
        });
    	});
    })
    .get('/cars',function(req,res){
    	 if(req.session.user!='')
    		res.redirect('/home?task=rent_car');
    	var sql='call get_cars()';
    	con.query(sql,function(err,result,fields){
    		console.log(result);
          res.render('cars.ejs', {
            user: req.session.user,
            result:result[0]
        });
    	});
    })
    .get('/services', function(req, res) {
        res.render('services.ejs');
    })
    .get('/contact', function(req, res) {
        res.render('contact.ejs');
    })
    .get('/query', function(req, res) {
        res.render('query.ejs');
    })
    .post('/query', urlencodedParser, function(req, res) {
        var sql = req.body.query;
        con.query(sql, function(err, result, fields) {
            if (err) res.render('query.ejs', {
                result_query: "There is some problem in your Query"
            });
            else {
                console.log(result);
                res.render('query.ejs', {
                    result_query: JSON.stringify(result)
                });
            }
        });
    })
    .post('/search', urlencodedParser, function(req, res) {
        console.log(req.body);
        var sql = 'select * from login ;'
        con.query(sql, function(err, result, fields) {
            if (err) throw err;
            req.session.result = result;
            res.send(req.session.result);
        });
    })
    .get('/database', urlencodedParser, function(req, res) {

        if (req.session.user != 'admin')
            res.redirect('/login');
        console.log(req.query);
        if (typeof(req.query.task) == 'undefined') {
            var tables = ['customer', 'flight', 'hotel', 'car', 'booking', 'payments', 'feedback'];
            var data = [];
            var num = 0;
            for (var j = 0; j < tables.length; j++) {
                var sql = 'select * from ' + tables[j] + ' ;';
                con.query(sql, function(err, result, fields) {
                    if (err) throw err;
                    data[num] = result;
                    num = num + 1;

                    if (num == tables.length)
                        res.render('mydb.ejs', {
                            result: data
                        })
                });
            }
        } else if (req.query.task == 'delete_customer') {
            console.log(req.query.email);
            var sql = 'delete from customer where customer_email=?';
            con.query(sql, [req.query.email], function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');

            });
        } else if (req.query.task == 'delete_feedback') {
            var sql = 'delete from feedback where email=?';
            con.query(sql, [req.query.email], function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        } else if (req.query.task == 'delete_car') {
            var sql = 'delete from car where car_id=?';
            con.query(sql, [req.query.id], function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        } else if (req.query.task == 'delete_hotel') {
            var sql = 'delete from hotel where hotel_id=?';
            con.query(sql, [req.query.id], function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        } else if (req.query.task == 'delete_flight') {
            var sql = 'delete from flight where flight_id=?';
            con.query(sql, [req.query.id], function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        } else if (req.query.task == 'delete_booking') {
            var sql = 'delete from booking where booking_id=?';
            con.query(sql, [req.query.id], function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        } else if (req.query.task == 'delete_payments') {
            var sql = 'delete from payments where payments_id=?';
            con.query(sql, [req.query.id], function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        }

    })

 .post('/database', urlencodedParser, function(req, res){
 	       
        if (req.body.task == 'insert_customer') {
            var sql = "insert into customer(customer_name,customer_mobile,customer_email,customer_username,customer_password,customer_address,customer_dob) values(?,?,?,?,?,?,?)";
            var values = [req.body.name, req.body.mobile, req.body.email, req.body.username, req.body.password, req.body.address, req.body.dob];
            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        }

        else if (req.body.task == 'insert_flight') {
            var sql = "insert into flight(flight_name,flight_from,flight_to,flight_class,flight_seatsfree,flight_date,flight_time,flight_fare) values(?,?,?,?,?,?,?,?)";
            var values = [req.body.fname, req.body.ffrom, req.body.fto, req.body.fclass, req.body.f_seatsfree, req.body.fdate, req.body.ftime,req.body.ffare];
            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        }

         else if (req.body.task == 'insert_hotel') {
         	
            var sql = "insert into hotel(hotel_name,room_type,hotel_rent,hotel_address,hotel_mobile,hotel_roomsfree,checkin_date,checkout_date,hotel_location) values(?,?,?,?,?,?,?,?,?)";
            var values = [req.body.hname, req.body.rtype, req.body.hrent,req.body.haddress,req.body.hmobile,req.body.h_roomsfree, req.body.h_checkin, req.body.h_checkout,req.body.h_location];
            console.log(values);
            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        }

        else if (req.body.task == 'insert_car') {
         	console.log(req.body);
            var sql = "insert into car(car_name,car_brand,car_rent,pickup_date,dropoff_date,location,cars_available) values(?,?,?,?,?,?,?)";
            var values = [req.body.cname, req.body.cbrand, req.body.crent,req.body.pickup_date,req.body.dropoff_date,req.body.location, req.body.cars_available];
           console.log(values);
            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                res.redirect('/database');
            });
        }




    })
    .post('/contact', urlencodedParser, function(req, res) {
        if (req.query.q == 'feedback') {
            var sql = 'insert into feedback values(?,?,?,?)';
            con.query(sql, [req.body.name, req.body.email, req.body.subject, req.body.message], function(err, result, fields) {
                if (err) throw err;
                res.render('contact.ejs', {
                    msg: 'Your feedback has been successfully submitted'
                });
            });
        }
    })


    .get('/home', function(req, res) {

        
        if ((typeof(req.session.user) == 'undefined' || req.session.user == '') && typeof(req.query.task) != 'undefined') {
            req.session.redirect = req.url;
            console.log(req.url);
            res.redirect('/login');
        }
        // console.log(req.session.customer[0].customer_id);
        else if (typeof(req.session.customer) == undefined || req.session.customer.length <= 0) {
            res.redirect('/');
        } else if (req.session.user == 'admin')
            res.redirect('/database');
        else if (typeof(req.query.task) == 'undefined' || req.query.task == 'update_profile') {
            con.query('select * from customer where customer_username=?', [req.session.user], function(err, result) {
                console.log(result);
                res.render('home.ejs', {
                    user: req.session.user,
                    result: result,
                    task: req.query.task
                });
            });
        } else if (req.query.task == 'cancel_booking') {  
         //ADHURA
         console.log(req.query);
         console.log(typeof(req.query.type));
            console.log('cancel_booking'+req.query.type+' '+req.query.id);
        	var sql='select * from '+req.query.type+' where booking_id='+req.query.id;
        	values=[(req.query.type).toString(),req.query.id];
        	console.log(sql+" "+values);
        	con.query(sql,function(err,result,fields){
                 if(err) throw err;
                 if(!err)
                 {
                 	console.log('cancel   '+result);
                 	res.render('home.ejs', {
                                    user: req.session.user,
                                    task: req.query.task,
                                    status: 'Successfully CANCELLED',
                                    type:req.query.type,
                                    result:result
                                });
                 }
        	});
        }  else if (req.query.task == 'change_password') {
            res.render('home.ejs', {
                user: req.session.user,
                task: req.query.task
            });
        } else if (req.query.task == 'feedback') {
            res.render('home.ejs', {
                user: req.session.user,
                task: req.query.task
            });
        } else if (req.query.task == 'make_payment') {
            var sql = 'insert into payments(payments_date,payments_amount,payments_for,customer_id,booking_id) values(?,?,?,?,?);';
            sql += 'update booking set payments_id=last_insert_id() where booking_id=?;';
            var values = [today, req.query.amt, req.query.type, req.session.customer[0].customer_id, req.query.id, req.query.id];
            console.log(req.query.amt);
            con.query(sql, values, function(err, result, fields) {
                if (err) {
                    throw err;
                    res.render('home.ejs', {
                        user: req.session.user,
                        task: req.query.task
                    });
                } else {
                    var sql2 = 'select * from payments p,booking b where p.payments_id=last_insert_id() and p.booking_id=b.booking_id and b.booking_type=p.payments_for;'
                    con.query(sql2, function(err2, result2, fields2) {
                        res.render('home.ejs', {
                            user: req.session.user,
                            task: req.query.task,
                            payment: result2
                        });
                        console.log(result2);
                    });
                }
            });
        } else if (req.query.task == 'my_payments' && typeof(req.query.p_id) == 'undefined') {
            var sql = 'select p.payments_date,p.payments_amount,p.payments_id,p.payments_for,p.booking_id,p.payments_desc,b.booking_date from payments p,customer c,booking b where p.customer_id=c.customer_id and b.booking_id=p.booking_id and c.customer_username=? order by payments_id desc';
            con.query(sql, [req.session.user], function(err, result, fiels) {
                if (err) throw err;
                else {
                    console.log(typeof(result[0].payments_date));
                    // console.log(result[0].payments_date.toYMD());
                    res.render('home.ejs', {
                        user: req.session.user,
                        task: req.query.task,
                        payment: result
                    });
                }
            });
        } else if (req.query.task == 'my_payments' && typeof(req.query.p_id) != 'undefined') {
            var sql2 = 'select * from payments p,booking b where p.payments_id=? and p.booking_id=b.booking_id and b.booking_type=p.payments_for;'
            con.query(sql2, [req.query.p_id], function(err2, result2, fields2) {
                res.render('home.ejs', {
                    user: req.session.user,
                    task: 'make_payment',
                    payment: result2,
                    type: 'details'
                });
                // console.log(result2);
            });
        } else if (req.query.task == 'my_bookings') {
            var sql1 = 'select * from hotel_booking where customer_id=? order by booking_id desc';
            // console.log(sql1+" "+req.session.customer[0].customer_id);
            var sql2 = 'select * from car_booking where customer_id=? order by booking_id desc';
            var sql3 = 'select * from flight_booking where customer_id=? order by booking_id desc';
            // var sql='select * from booking b,customer c where b.customer_id=c.customer_id and c.customer_username=?';
            con.query(sql1, [req.session.customer[0].customer_id], function(err1, result1, fields) {
                con.query(sql2, [req.session.customer[0].customer_id], function(err2, result2, fields2) {
                    con.query(sql3, [req.session.customer[0].customer_id], function(err3, result3, fields3) {
                        // console.log(result3);
                        {
                            if (result1.length < 0 && result2.length < 0 && result3.length < 0) {
                                // console.log("'home.ejs',{user:req.session.user,task:req.session.task,status:'failure'}");
                                res.render('home.ejs', {
                                    user: req.session.user,
                                    task: req.query.task,
                                    status: 'failure'
                                });
                            } else {
                                // console.log("'home.ejs',{user:req.session.user,task:req.query.task,hotel_bookings:result1,car_bookings:result2,flight_bookings:result3,status:'success'}");
                                // console.log(result3[0].booking_date.toYMD()+typeof(result3[0].booking_date));
                                res.render('home.ejs', {
                                    user: req.session.user,
                                    task: req.query.task,
                                    hotel_bookings: result1,
                                    car_bookings: result2,
                                    flight_bookings: result3,
                                    status: 'success'
                                });
                            }
                        }
                    });
                });
            });
        } else if (req.query.task == 'book_flight') {
            if (typeof(req.query.id) == 'undefined') {
                res.render('home.ejs', {
                    user: req.session.user,
                    task: req.query.task
                });
            } else if (typeof(req.query.id) != 'undefined' && typeof(req.query.b_id) == 'undefined') {
                var sql = 'select * from flight where flight_id=?';
                con.query(sql, [req.query.id], function(err, result, fields) {
                    if (err) throw err;
                    if (result.flight_seatsfree <= 0)
                        res.render('home.ejs', {
                            user: req.session.user,
                            task: req.query.task,
                            booking: 'failure'
                        });
                    else {
                        var sql = 'update flight set flight_seatsfree=flight_seatsfree-1 where flight_id=?';
                        con.query(sql, [req.query.id], function(err, resulti, fields) {
                            if (err) throw err;
                        });

                        var sql2 = 'insert into booking(booking_type,flight_id,booking_date,travel_date,customer_id,booking_source,booking_destination,booking_price) values(?,?,?,?,?,?,?,?)';
                        values = ['flight', req.query.id, today, result[0].flight_date, req.session.customer[0].customer_id, result[0].flight_from, result[0].flight_to, result[0].flight_fare];
                        con.query(sql2, values, function(err, result, fields) {
                            console.log(result);
                            if (err)
                                res.render('home.ejs', {
                                    user: req.session.user,
                                    task: req.query.task,
                                    booking: 'failure'
                                });
                            else {
                                con.query('select * from booking b,flight f where b.booking_id=last_insert_id() and b.flight_id=f.flight_id', function(err, resultb) {
                                    console.log(resultb);
                                    res.render('home.ejs', {
                                        user: req.session.user,
                                        task: req.query.task,
                                        booking: 'success',
                                        values: resultb
                                    });
                                });
                            }
                        });
                    }
                });
            } else if (typeof(req.query.id) != 'undefined' && typeof(req.query.b_id) != 'undefined') {
                con.query('select * from booking b,flight f where b.booking_id=? and b.flight_id=f.flight_id', [req.query.b_id], function(err, resultb) {
                    // console.log(resultb);
                    res.render('home.ejs', {
                        user: req.session.user,
                        task: req.query.task,
                        booking: 'success',
                        values: resultb,
                        type: 'details'
                    });
                });
            }
        } else if (req.query.task == 'book_hotel') {
            if (typeof(req.query.id) == 'undefined') {
                res.render('home.ejs', {
                    user: req.session.user,
                    task: req.query.task
                });
            } else if (typeof(req.query.id) != 'undefined' && typeof(req.query.b_id) == 'undefined') {
                var sql = 'select * from hotel where hotel_id=?';
                con.query(sql, [req.query.id], function(err, result, fields) {
                    if (err) throw err;
                    if (result.hotel_roomsfree <= 0)
                        res.render('home.ejs', {
                            user: req.session.user,
                            task: req.query.task,
                            booking: 'failure'
                        });
                    else {
                        var sql = 'update hotel set hotel_roomsfree=hotel_roomsfree-1 where hotel_id=?';
                        con.query(sql, [req.query.id], function(err, resulti, fields) {
                            if (err) throw err;
                        });

                        var sql2 = 'insert into booking(booking_type,hotel_id,booking_date,travel_date,customer_id,end_date,booking_source,booking_price) values(?,?,?,?,?,?,?,?)';
                        values = ['hotel', req.query.id, today, result[0].checkin_date, req.session.customer[0].customer_id, result[0].checkout_date, result[0].hotel_location, result[0].hotel_rent];
                        con.query(sql2, values, function(err, result, fields) {
                            // console.log(result);
                            if (err)
                                res.render('home.ejs', {
                                    user: req.session.user,
                                    task: req.query.task,
                                    booking: 'failure'
                                });
                            else {
                                con.query('select * from booking b,hotel h where b.booking_id=last_insert_id() and b.hotel_id=h.hotel_id', function(err, resultb) {
                                    // console.log(resultb);
                                    res.render('home.ejs', {
                                        user: req.session.user,
                                        task: req.query.task,
                                        booking: 'success',
                                        values: resultb
                                    });
                                });
                            }
                        });
                    }
                });
            } else if (typeof(req.query.id) != 'undefined' && typeof(req.query.b_id) != 'undefined') {
                con.query('select * from booking b,hotel f where b.booking_id=? and b.hotel_id=f.hotel_id', [req.query.b_id], function(err, resultb) {
                    // console.log(resultb);
                    res.render('home.ejs', {
                        user: req.session.user,
                        task: req.query.task,
                        booking: 'success',
                        values: resultb,
                        type: 'details'
                    });
                });
            }
        } else if (req.query.task == 'rent_car') {
            if (typeof(req.query.id) == 'undefined') {
                res.render('home.ejs', {
                    user: req.session.user,
                    task: req.query.task
                });
            } else if (typeof(req.query.id) != 'undefined' && typeof(req.query.b_id) == 'undefined') {
                var sql = 'select * from car where car_id=?';
                con.query(sql, [req.query.id], function(err, result, fields) {
                    if (err) throw err;
                    if (result.cars_available <= 0)
                        res.render('home.ejs', {
                            user: req.session.user,
                            task: req.query.task,
                            booking: 'failure'
                        });
                    else {
                        var sql = 'update car set cars_available=cars_available-1 where car_id=?';
                        con.query(sql, [req.query.id], function(err, resulti, fields) {
                            if (err) throw err;
                        });

                        var sql2 = 'insert into booking(booking_type,car_id,booking_date,travel_date,customer_id,end_date,booking_source,booking_price) values(?,?,?,?,?,?,?,?)';
                        values = ['car', req.query.id, today, result[0].pickup_date, req.session.customer[0].customer_id, result[0].dropoff_date, result[0].location, result[0].car_rent];
                        con.query(sql2, values, function(err, result, fields) {
                            // console.log(result);
                            if (err)
                                res.render('home.ejs', {
                                    user: req.session.user,
                                    task: req.query.task,
                                    booking: 'failure'
                                });
                            else {
                                con.query('select * from booking b,car c where b.booking_id=last_insert_id() and b.car_id=c.car_id', function(err, resultb) {
                                    // console.log(resultb);
                                    res.render('home.ejs', {
                                        user: req.session.user,
                                        task: req.query.task,
                                        booking: 'success',
                                        values: resultb
                                    });
                                });
                            }
                        });
                    }
                });
            } else if (typeof(req.query.id) != 'undefined' && typeof(req.query.b_id) != 'undefined') {
                con.query('select * from booking b,car f where b.booking_id=? and b.car_id=f.car_id', [req.query.b_id], function(err, resultb) {
                    // console.log(resultb);
                    res.render('home.ejs', {
                        user: req.session.user,
                        task: req.query.task,
                        booking: 'success',
                        values: resultb,
                        type: 'details'
                    });
                });
            }
        }
    })


    .post('/home', urlencodedParser, function(req, res) {

        console.log(req.body);
        if (typeof(req.query.task) != 'undefined' && req.query.task == 'update_profile') {
            var sql = 'update customer set customer_name=?,customer_email=?,customer_dob=?,customer_address=?,customer_mobile=? where customer_username=?';
            var values = [req.body.name, req.body.email, req.body.dob, req.body.address, req.body.mobile, req.session.user];
            // console.log(sql);
            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                else
                    fetchCustomer(req, res);
            });
        }

        else if (req.query.task == 'cancel_booking') {
        	
        	var sql="update booking set booking_desc=? where booking_id=?"
        	con.query(sql,['CANCELLED',req.query.id],function(err,result,fields){
                 var url='/home?task=cancel_booking&id='+req.query.id+'&type='+req.query.type;
                 if(!err){
                 	res.redirect(url);
                 }
        	});
          } 

        else if (req.query.task == 'feedback') {
            var sql = 'insert into feedback values(?,?,?,?)';
            con.query(sql, [req.body.name, req.body.email, req.body.subject, req.body.message], function(err, result, fields) {
                if (err)
                    res.render('home.ejs', {
                        user: req.session.user,
                        task: req.query.task,
                        status: 'failure'
                    });
                res.render('home.ejs', {
                    user: req.session.user,
                    task: req.query.task,
                    status: 'success'
                });
            });

        }

        if (req.query.task == 'change_password') {
            // console.log(req.body);
            var sql = 'update customer set customer_password=? where customer_username=? and customer_password=?';
            var values = [req.body.new_password, req.session.user,req.body.old_password];
            if (req.body.old_password!=req.session.customer[0].customer_password || req.body.new_password!=req.body.new_password2) {
               {
                	  res.render('home.ejs', {
                user: req.session.user,
                task: req.query.task,
                message:'Unable to change password/Incorrect Password'
                  });
                }
            }
            else
            {
            con.query(sql, values, function(err, result, fields) {
            	console.log(result);
                if (err) throw err;               
                else
                    // fetchCustomer(req, res);
                      res.render('home.ejs', {
                user: req.session.user,
                task: req.query.task,
                message:'Password successfully changed'
                  });                
            });
          }
        }

        if (req.query.task == 'book_flight') {
            var sql = 'select * from flight where flight_from=? and flight_to=? and flight_date=? and status="AVAILABLE"';
            console.log(sql);
            var values = [req.body.from, req.body.to, req.body.date];

            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                console.log(result);
                res.render('home.ejs', {
                    user: req.session.user,
                    task: req.query.task,
                    flights: result
                });
            });
        }

        if (req.query.task == 'book_hotel') {
            console.log(req.body);
            var sql = 'select * from hotel where hotel_location=? and checkin_date=? and checkout_date=? and status="AVAILABLE"';
            // console.log(sql);
            var values = [req.body.location, req.body.checkin_date, req.body.checkout_date];

            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                res.render('home.ejs', {
                    user: req.session.user,
                    task: req.query.task,
                    hotels: result
                });
            });
        }

        if (req.query.task == 'rent_car') {
            // console.log(req.body);
            var sql = 'select * from car where location=? and pickup_date=? and dropoff_date=? and status="AVAILABLE"';
            var values = [req.body.location, req.body.pickup_date, req.body.dropoff_date];

            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                res.render('home.ejs', {
                    user: req.session.user,
                    task: req.query.task,
                    cars: result
                });
                // console.log(result);
            });
        }
    })
    .get('/profile', function(req, res) {
        res.redirect('/');
    })

    .get('/logout', urlencodedParser, function(req, res) {
        req.session = null;
        res.redirect('/');
    })


    .get('/login',function(req,res){
       if(req.query.task==null)
       	res.render('login.ejs');

       else if(req.query.task=='create')
       {
       	            res.render('register.ejs', {
                user: req.session.user
            });
       }

       else if(req.query.task=='forgot')
       {
       	  res.render('forgot.ejs', {});
       }
       
    })

    .post('/login',urlencodedParser,function(req,res){
        if(req.body.task=='login')
        {
        	 var sql = 'select customer_password from customer where customer_username =?';

             con.query(sql, [req.body.username], function(err, result, fields) {
                if (err) throw err;
                if (result.length > 0) {
                    if (req.body.password == result[0].customer_password) {
                        req.session.user = req.body.username;
                        fetchCustomer(req, res);
                       
                    } else {
                        res.render('login.ejs', {
                            displayMessage: "Password and username does not match"
                        });
                    }
                } else {
                    res.render('login.ejs', {
                        displayMessage: "Username does not exist"
                    });
                   }
               });
         }
                	
          
         else if(req.body.task=='create')
         {
         	 var sql = "insert into customer(customer_name,customer_mobile,customer_email,customer_username,customer_password,customer_address,customer_dob,gender) values(?,?,?,?,?,?,?,?)";

            var values = [req.body.name, req.body.mobile, req.body.email, req.body.username, req.body.password, req.body.address, req.body.dob,req.body.gender];
            con.query(sql, values, function(err, result, fields) {
                if (err) throw err;
                res.render('login.ejs', {
                    displayMessage: "User account Created Successfully"
                });
            });
         }


         else if(req.body.task=="forgot")
        {
         res.render('reset.ejs', {
                resetEmail: req.body.email
            });
        }

        else if(req.body.task=="reset")
        {
        	console.log(req.body.task+"  "+req.body.password+" "+req.body.email);
        	var sql = 'update customer set customer_password= ? where customer_email= ?';

            con.query(sql, [req.body.password, req.body.email], function(err, result, fields) {
                if (err) throw err;
                dispMessage = 'Password reset Successfull';
                res.render('login.ejs', {
                    displayMessage: dispMessage
                });
            });
        }
         
    })
.listen(8080);