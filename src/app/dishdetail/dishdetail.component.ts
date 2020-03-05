import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DishService } from '../services/dish.service';
import { switchMap, switchMapTo } from 'rxjs/operators'

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Comment } from '../shared/comment';

import { visibility, flyInOut, expand } from '../animations/app.animations';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display: block;'
  },
  animations: [
    visibility(),
    flyInOut(),
    expand()
  ]
})

export class DishdetailComponent implements OnInit {

  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  errMess: string;
  commentForm: FormGroup;
  comment: Comment;
  dishcopy: Dish;
  visibility = 'shown';
  
  @ViewChild('fform') commentFormDirective : NgForm; 
  
  formErrors = {
    'comment': '',
    'author': ''
  }

  validationMessages = {
    'comment': {
      'required':      'The comment is required.'
    },
    'author': {
      'required':      'Author is required.',
      'minlength':     'Author must be at least 2 characters long.'
    },
  };

  constructor(private dishService: DishService, 
    private route : ActivatedRoute,
    private location: Location,
    private fb: FormBuilder, 
    @Inject('BaseURL') private BaseURL ) { 
      this.createForm();
    }

  ngOnInit() {
    this.dishService.getDishIds()
    .subscribe(dishIds => this.dishIds = dishIds);
    this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(params['id']); }))
    .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
      errmess => this.errMess = <any>errmess);
  }

  goBack() : void {
    this.location.back();
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }
  
  createForm() {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required],
      author: ['', [Validators.required, Validators.minLength(2)]],
      rating: 5,
      date: ''
    });    

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); //reset from validation messages
  }

  onValueChanged(data?: any) {
    if(!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if(this.formErrors.hasOwnProperty(field)){
        //clear previous errors
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.comment.date = new Date().toISOString()
    //this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = <any>errmess; });
    console.log(this.comment);
    this.commentFormDirective.resetForm();   
    this.commentForm.reset({
      comment: '',
      author: '',
      rating: 5,
      date: ''
    });

     
  }

}
