import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
selector:'app-emergency-requests',
standalone:true,
imports:[
CommonModule,
FormsModule
],
templateUrl:'./emergency-requests.component.html',
styleUrls:['./emergency-requests.component.css']
})
export class EmergencyRequestsComponent{

requests=[

{
id:'ER-2844',
initials:'DB',
citizen:'David Brown',
type:'Earthquake',
priority:'Critical',
status:'Pending',
location:'San Jose, CA',
volunteer:'—',
time:'13:22'
},

{
id:'ER-2841',
initials:'PS',
citizen:'Priya Sharma',
type:'Flood',
priority:'Low',
status:'Pending',
location:'Phoenix, AZ',
volunteer:'—',
time:'11:30'
}

];

typeFilter='All';

statusFilter='Pending';

}