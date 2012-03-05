// TEST GLOBALS

expect = require('chai').expect
mdoq = require('mdoq')
user = {email: 'name@domain.com', password: 'name-pass', first: 'name', last: 'LAST-name'}
names = ["LIAM","CHARLOTTE","NOAH","SOPHIA","AIDAN","AMELIA","JACKSON","OLIVIA","CALEB","AVA","OLIVER","LILY","GRAYSON","EMMA","ETHAN","SCARLETT","ALEXANDER","AUDREY","OWEN","HARPER","BENJAMIN","ABIGAIL","LUCAS","CHLOE","LANDON","ELLA","ASHER","VIOLET","ELIJAH","ELIZABETH","DECLAN","ARIA","CAYDEN","ISABELLA","JACOB","CLAIRE","MASON","MADELINE","LEVI","GRACE","CONNOR","LILA","WILLIAM","ARIANNA","HENRY","NORA","GABRIEL","LAYLA","GAVIN","LUCY","LOGAN","AVERY","ELLIOT","STELLA","JAMES","AUBREY","FINN","HANNAH","EMMETT","SAVANNAH","ISAAC","ADDISON","ANDREW","EVELYN","WYATT","ADALYN","CARTER","VIVIENNE","COLE","ISABELLE","COLIN","SOPHIE","NATHAN","AURORA","ELI","JULIET","SAMUEL","NATALIE","DYLAN","ISLA","MICAH","EMILY","SEBASTIAN","CLARA","PARKER","EVANGELINE","MILES","LEAH","JONAH","PENELOPE","BRADEN","CATHERINE","NICHOLAS","CAROLINE","HUDSON","SADIE","ZACHARY","ADELE","CHASE","GENEVIEVE","LUKE","PAIGE","JUDE","ANNA","HOLDEN","MIA","EVAN","LORELEI","IAN","LYDIA","NATHANIEL","EDEN","BENTLEY","ADELAIDE","TRISTAN","ANNABELLE","MATTHEW","WILLOW","DOMINIC","BRIELLE","JOSHUA","PIPER","SAWYER","ZOE","NOLAN","QUINN","JASPER","PAYTON","AARON","HAYLEY","SILAS","ZOEY","JAYDEN","LILLIAN","DANIEL","ELEANOR","BENNETT","RUBY","RYDER","AUTUMN","ADAM","KEIRA","BLAKE","MOLLY","RYAN","TEAGAN","ISAIAH","BROOKLYN","XAVIER","RILEY","COLTON","BELLA","MAX","FIONA","SETH","ROSALIE","CARSON","EVA","HUNTER","SIENNA","MICHAEL","VICTORIA","COOPER","ELISE","EVERETT","GABRIELLA","CHARLES","DELILAH","EZRA","MADISON","THEODORE","CORA","BRODY","ARABELLA","CAMERON","IVY","JULIAN","AALIYAH","LEO","ALYSSA","AUSTIN","SAMANTHA","ARCHER","REAGAN","JACE","SARAH","ADRIAN","NAOMI","HARRISON","CADENCE","THOMAS","JULIA","JOSEPH","ALEXIS","JOHN","HAZEL","TYLER","LAUREN"]
users = mdoq.use(require('../')).use('test-db').use('/users')
totalUsers = names.length

function clear(fn) {
  users.del(fn);
}

beforeEach(function(done){
  clear(function (err) {
    // insert test data
    var tusers = []
      , i = totalUsers
    ;
      
    while(i--) {
      var u = JSON.parse(JSON.stringify(user).replace(/name/g, names[i]));
      u.joined = i;
      
      tusers.push(u);
    }
    
    users.post(tusers, done);
  })
});

// clean up db
after(clear);