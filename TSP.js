

function osszehasonlitas(lista1, lista2){
    for (let i = 0; i < lista1.length; ++i){
        if (lista1[i] == 0)
            continue;
        if (lista2[i] == 0){
            lista1.splice(i, 1);
            lista1.splice(i, 0, 0);
        }
        if (lista2[i] < lista1[i]){
            lista1.splice(i, 1);
            lista1.splice(i, 0, lista2[i]);
        }
    }
    return lista1
}

function k_varos_beszurasa(matrix, reszkorut, k){
    let m = 10000000;
    let i = 0;
    let idx = 0;
    while (i < reszkorut.length - 1){
        let osszeg = 0.0;
        let u = reszkorut[i];
        let v = reszkorut[i + 1];
        osszeg = matrix[u][k] + matrix[k][v] - matrix[u][v];
        if (osszeg < m){
            m = osszeg;
            idx = i;
        }
        i++;
        if (i == reszkorut.length - 1){
            u = reszkorut[i];
            v = reszkorut[0];
            osszeg = matrix[u][k] + matrix[k][v] - matrix[u][v];
            if (osszeg < m){
                m = osszeg;
                idx = i;
            }
        }
    }
    return idx;
}

function celfuggvenyKiszamitasa(matrix, reszkorut){
    let celfuggveny = 0.0;
    let utolso_elem = reszkorut[matrix.length - 1];
    celfuggveny = matrix[utolso_elem][0];
    for (let i = 0; i < reszkorut.length - 1; ++i){
        let k = reszkorut[i];
        let kk = reszkorut[i + 1];
        celfuggveny += matrix[k][kk];
    }
    return celfuggveny;
}

function TSP_Nearest_Addition(s_matrix, vec){
    let reszkorut = [0];
    let idx = 0;
    let r = 0;
    while (r < s_matrix.length - 1){
        let _min = 10000000;
        if (r == 0){
            for (let i = 0; i < s_matrix.length; ++i){
                if (vec[i] != 0 && vec[i] < _min){
                    _min = vec[i];
                    idx = i;
                }
            }
            reszkorut.push(idx);
        }
        else
        {
            vec = osszehasonlitas(vec, s_matrix[idx]);
            for (let i = 0; i < s_matrix.length; ++i){
                if (vec[i] != 0 && vec[i] < _min){
                    _min = vec[i];
                    idx = i;
                }
            }
            reszkorut.push(idx);
        }
        r++;
    }
    return reszkorut;
}

function TSP_Nearest_Insertion(matrix,s_matrix, vec){
    let reszkorut = [0];
    let idx = 0;
    let r = 0;
    let k = 0;
    while (r < s_matrix.length - 1){
        let _min = 10000000;
        if (r == 0){
            for (let i = 0; i < s_matrix.length; ++i){
                if (vec[i] != 0 && vec[i] <_min){
                    _min = vec[i];
                    k = i;
                }
            }
            reszkorut.push(k);
        }
        else
        {
            vec = osszehasonlitas(vec, s_matrix[k]);
            for (let i = 0; i < s_matrix.length; ++i){
                if (vec[i] != 0 && vec[i] < _min){
                    _min = vec[i];
                    k = i;
                }
            }
            idx = k_varos_beszurasa(matrix, reszkorut, k);
            reszkorut.splice(idx + 1, 0, k);
        }
        r++;
    }
    return reszkorut;
}

function TSP_Farthest_Insertion(s_matrix, vec){
    let reszkorut = [0];
    let idx = 0;
    let r = 0;
    let k = 0;
    while (r < s_matrix.length - 1){
        let _max = -1;
        if (r == 0){
            for (let i = 0; i < s_matrix.length; ++i){
                if (vec[i] != 0 && vec[i] > _max){
                    _max = vec[i];
                    k = i;
                }
            }
            reszkorut.push(k);
        }
        else
        {
            vec = osszehasonlitas(vec, s_matrix[k]);
            for (let i = 0; i < s_matrix.length; ++i){
                if (vec[i] != 0 && vec[i] > _max){
                    _max = vec[i];
                    k = i;
                }
            }
            idx = k_varos_beszurasa(s_matrix, reszkorut, k);
            reszkorut.splice(idx + 1, 0, k);
        }
        r++;
    }
    return reszkorut;
}

function min(matrix,s_matrix, a, b, c){
    let vec = JSON.parse(JSON.stringify(matrix[0]));
    let tsp = [];
    if(a < b && a < c){
        return TSP_Nearest_Addition(matrix, vec);
    } 
    else if(b < c){
        return TSP_Nearest_Insertion(s_matrix, vec);
    } else return TSP_Farthest_Insertion(s_matrix, vec);
}

function minKoltseg(matrix, s_matrix, vec){
    let reszkorut_N_A = [];
    let reszkorut_N_I = [];
    let reszkorut_F_I = [];

    let celfuggveny_N_A = 0.0;
    let celfuggveny_N_I = 0.0;
    let celfuggveny_F_I = 0.0;

    vec = JSON.parse(JSON.stringify(matrix[0]));
    reszkorut_N_I = TSP_Nearest_Insertion(matrix,s_matrix, vec);
    celfuggveny_N_I = celfuggvenyKiszamitasa(matrix, reszkorut_N_I);

    vec = JSON.parse(JSON.stringify(matrix[0]));
    reszkorut_F_I = TSP_Farthest_Insertion(s_matrix, vec);
    celfuggveny_F_I = celfuggvenyKiszamitasa(matrix, reszkorut_F_I);

    vec = JSON.parse(JSON.stringify(matrix[0]));
    reszkorut_N_A = TSP_Nearest_Addition(s_matrix, vec);
    celfuggveny_N_A = celfuggvenyKiszamitasa(matrix, reszkorut_N_A);

    return min(matrix, s_matrix, celfuggveny_N_A, celfuggveny_N_I, celfuggveny_F_I);

}

function callback()
{
    let matrix = [[0, 2, 11, 10, 8, 7, 6, 5],
                  [6, 0, 1, 8, 8, 4, 6, 7],
                  [5, 12, 0, 11, 8, 12, 3, 11],
                  [11, 9, 10, 0, 1, 9, 8, 10],
                  [11, 11, 9, 4, 0, 2, 10, 9],
                  [12, 8, 5, 2, 11, 0, 11, 9],
                  [10, 11, 12, 10, 9, 12, 0, 3],
                  [7, 10, 10, 10, 6, 3, 1, 0]]
    
    
    let s_matrix = JSON.parse(JSON.stringify(matrix));
    let vec = JSON.parse(JSON.stringify(matrix[0]));
    let m = [];
    m = minKoltseg(matrix, s_matrix, vec);
    console.log(m);

}

// callback();

// console.log(s_matrix);
// console.log(m);
// let reszkorut_N_A = [];
// let reszkorut_N_I = [];
// let reszkorut_F_I = [];

// let celfuggveny_N_A = 0.0;
// let celfuggveny_N_I = 0.0;
// let celfuggveny_F_I = 0.0;

// console.log("TSP_Nearest_Insertion");
// vec = JSON.parse(JSON.stringify(matrix[0]));
// reszkorut_N_I = TSP_Nearest_Insertion(s_matrix, vec);
// console.log(reszkorut_N_I);
// celfuggveny_N_I = celfuggvenyKiszamitasa(matrix, reszkorut_N_I);
// console.log("Celfuggveny:");
// console.log(celfuggveny_N_I);


// console.log("TSP_Farthest_Insertion");
// vec = JSON.parse(JSON.stringify(matrix[0]));
// reszkorut_F_I = TSP_Farthest_Insertion(s_matrix, vec);
// console.log(reszkorut_F_I);
// celfuggveny_F_I = celfuggvenyKiszamitasa(matrix, reszkorut_F_I);
// console.log("Celfuggveny:");
// console.log(celfuggveny_F_I);

// console.log("TSP_Nearest_Addition");
// vec = JSON.parse(JSON.stringify(matrix[0]));
// reszkorut_N_A = TSP_Nearest_Addition(s_matrix, vec);
// console.log(reszkorut_N_A);
// celfuggveny_N_A = celfuggvenyKiszamitasa(matrix, reszkorut_N_A);
// console.log("Celfuggveny:");let s_matrix = JSON.parse(JSON.stringify(matrix));




