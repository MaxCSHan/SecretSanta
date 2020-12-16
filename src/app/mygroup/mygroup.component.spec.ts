import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MygroupComponent } from './mygroup.component';

describe('MygroupComponent', () => {
  let component: MygroupComponent;
  let fixture: ComponentFixture<MygroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MygroupComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MygroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
